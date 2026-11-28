package com.dungnt.loanthememe;

import android.content.Context;
import android.net.wifi.WifiManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Chơi nhiều người trong mạng WiFi nội bộ, KHÔNG cần máy chủ:
 *  - máy chủ phòng mở cổng TCP 47811 và phát tín hiệu UDP (cổng 47812) mỗi giây để máy khác tìm thấy phòng;
 *  - máy khách nghe tín hiệu để liệt kê phòng rồi nối TCP tới chủ phòng;
 *  - mỗi tin là một dòng JSON (kết thúc bằng xuống dòng).
 * Sự kiện gửi lên web: "room" {ip,code,name,n,max,open} · "peer" {id,on} · "msg" {from,data} · "closed" {}.
 */
@CapacitorPlugin(name = "LanPlay")
public class LanPlugin extends Plugin {
    private static final int TCP_PORT = 47811;
    private static final int UDP_PORT = 47812;

    private static class Conn {
        final int id; final Socket sock; final OutputStream out;
        Conn(int id, Socket sock) throws Exception { this.id = id; this.sock = sock; this.out = sock.getOutputStream(); }
    }

    private volatile ServerSocket server;
    private volatile Socket client;
    private volatile OutputStream clientOut;
    private volatile DatagramSocket scanSock;
    private volatile boolean beaconOn = false;
    private volatile int gen = 0;
    private final Map<Integer, Conn> conns = new ConcurrentHashMap<>();
    private int nextId = 1;
    private volatile String roomName = "Room";
    private volatile int infoN = 1, infoMax = 8, infoOpen = 1;
    private ExecutorService sender = Executors.newSingleThreadExecutor();
    private WifiManager.MulticastLock mlock;

    // ---------- địa chỉ ----------
    private static String localIp() {
        String best = null;
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                String nm = ni.getName() == null ? "" : ni.getName();
                for (InetAddress a : Collections.list(ni.getInetAddresses())) {
                    if (!(a instanceof Inet4Address) || !a.isSiteLocalAddress()) continue;
                    String ip = a.getHostAddress();
                    if (nm.startsWith("wlan") || nm.startsWith("ap") || nm.startsWith("swlan") || nm.startsWith("softap")) return ip;
                    if (best == null) best = ip;
                }
            }
        } catch (Exception ignored) { }
        return best;
    }

    private static List<InetAddress> broadcasts() {
        List<InetAddress> out = new ArrayList<>();
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InterfaceAddress ia : ni.getInterfaceAddresses()) {
                    InetAddress b = ia.getBroadcast();
                    if (b != null) out.add(b);
                }
            }
            out.add(InetAddress.getByName("255.255.255.255"));
        } catch (Exception ignored) { }
        return out;
    }

    private static String codeOf(String ip) {
        if (ip == null) return "";
        String[] p = ip.split("\\.");
        return p.length == 4 ? p[2] + "." + p[3] : ip;
    }

    /** "1.23" hoặc "23" → ghép với phần đầu địa chỉ của chính máy này; địa chỉ đủ 4 số thì giữ nguyên. */
    private static String resolve(String addr) {
        if (addr == null) return null;
        addr = addr.trim().replace(',', '.').replace(' ', '.');
        String[] p = addr.split("\\.");
        if (p.length == 4) return addr;
        String me = localIp();
        if (me == null) return null;
        String[] m = me.split("\\.");
        if (p.length == 2) return m[0] + "." + m[1] + "." + p[0] + "." + p[1];
        if (p.length == 1) return m[0] + "." + m[1] + "." + m[2] + "." + p[0];
        return null;
    }

    private void emit(String ev, JSObject o) { notifyListeners(ev, o); }

    // ---------- chủ phòng ----------
    @PluginMethod
    public void host(PluginCall call) {
        shutdown();
        final int g = gen;
        roomName = call.getString("name", "Room");
        infoN = 1; infoMax = 8; infoOpen = 1;
        try {
            ServerSocket ss = new ServerSocket();
            ss.setReuseAddress(true);
            ss.bind(new InetSocketAddress(TCP_PORT));
            server = ss;
        } catch (Exception e) { call.reject("Cannot open the room port: " + e.getMessage()); return; }
        final ServerSocket ss = server;
        new Thread(() -> {
            while (g == gen && !ss.isClosed()) {
                try {
                    Socket s = ss.accept();
                    s.setTcpNoDelay(true);
                    final Conn c;
                    synchronized (this) { c = new Conn(nextId++, s); }
                    conns.put(c.id, c);
                    JSObject o = new JSObject(); o.put("id", c.id); o.put("on", true); emit("peer", o);
                    new Thread(() -> readLoop(g, c)).start();
                } catch (Exception e) { break; }
            }
        }, "ltm-accept").start();
        beaconOn = true;
        new Thread(() -> {
            DatagramSocket ds = null;
            try {
                ds = new DatagramSocket(); ds.setBroadcast(true);
                while (g == gen && beaconOn) {
                    JSONObject j = new JSONObject();
                    j.put("ltm", 1); j.put("name", roomName); j.put("n", infoN); j.put("max", infoMax); j.put("open", infoOpen);
                    byte[] b = j.toString().getBytes(StandardCharsets.UTF_8);
                    for (InetAddress a : broadcasts()) {
                        try { ds.send(new DatagramPacket(b, b.length, a, UDP_PORT)); } catch (Exception ignored) { }
                    }
                    Thread.sleep(1000);
                }
            } catch (Exception ignored) { } finally { if (ds != null) ds.close(); }
        }, "ltm-beacon").start();
        String ip = localIp();
        JSObject r = new JSObject(); r.put("ip", ip == null ? "" : ip); r.put("code", codeOf(ip)); r.put("port", TCP_PORT);
        call.resolve(r);
    }

    private void readLoop(int g, Conn c) {
        try {
            BufferedReader br = new BufferedReader(new InputStreamReader(c.sock.getInputStream(), StandardCharsets.UTF_8), 65536);
            String line;
            while (g == gen && (line = br.readLine()) != null) {
                if (line.isEmpty()) continue;
                JSObject o = new JSObject(); o.put("from", c.id); o.put("data", line); emit("msg", o);
            }
        } catch (Exception ignored) { }
        if (conns.remove(c.id) != null && g == gen) {
            JSObject o = new JSObject(); o.put("id", c.id); o.put("on", false); emit("peer", o);
        }
        try { c.sock.close(); } catch (Exception ignored) { }
    }

    @PluginMethod
    public void setInfo(PluginCall call) {
        infoN = call.getInt("n", infoN); infoMax = call.getInt("max", infoMax); infoOpen = call.getInt("open", infoOpen);
        call.resolve();
    }

    // ---------- tìm phòng ----------
    @PluginMethod
    public void scan(PluginCall call) {
        stopScanInternal();
        final int g = gen;
        try {
            WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) { mlock = wm.createMulticastLock("ltm-lan"); mlock.setReferenceCounted(false); mlock.acquire(); }
        } catch (Exception ignored) { }
        try {
            DatagramSocket ds = new DatagramSocket(null);
            ds.setReuseAddress(true); ds.setBroadcast(true);
            ds.bind(new InetSocketAddress(UDP_PORT));
            scanSock = ds;
        } catch (Exception e) { call.reject("Cannot listen for rooms: " + e.getMessage()); return; }
        final DatagramSocket ds = scanSock;
        new Thread(() -> {
            byte[] buf = new byte[2048];
            String me = localIp();
            while (g == gen && !ds.isClosed()) {
                try {
                    DatagramPacket p = new DatagramPacket(buf, buf.length);
                    ds.receive(p);
                    String ip = p.getAddress().getHostAddress();
                    if (server != null && ip != null && ip.equals(me)) continue;
                    JSONObject j = new JSONObject(new String(p.getData(), 0, p.getLength(), StandardCharsets.UTF_8));
                    if (j.optInt("ltm", 0) != 1) continue;
                    JSObject o = new JSObject();
                    o.put("ip", ip); o.put("code", codeOf(ip)); o.put("name", j.optString("name", "Room"));
                    o.put("n", j.optInt("n", 1)); o.put("max", j.optInt("max", 8)); o.put("open", j.optInt("open", 1));
                    emit("room", o);
                } catch (Exception e) { if (ds.isClosed()) break; }
            }
        }, "ltm-scan").start();
        call.resolve();
    }

    private void stopScanInternal() {
        DatagramSocket ds = scanSock; scanSock = null;
        if (ds != null) ds.close();
        try { if (mlock != null && mlock.isHeld()) mlock.release(); } catch (Exception ignored) { }
        mlock = null;
    }

    @PluginMethod
    public void stopScan(PluginCall call) { stopScanInternal(); call.resolve(); }

    // ---------- khách vào phòng ----------
    @PluginMethod
    public void join(PluginCall call) {
        final String ip = resolve(call.getString("ip", ""));
        if (ip == null) { call.reject("Not connected to Wi-Fi, or the room code is not valid."); return; }
        shutdown();
        final int g = gen;
        new Thread(() -> {
            try {
                Socket s = new Socket();
                s.setTcpNoDelay(true);
                s.connect(new InetSocketAddress(ip, TCP_PORT), 4000);
                if (g != gen) { s.close(); return; }
                client = s; clientOut = s.getOutputStream();
                JSObject r = new JSObject(); r.put("ip", ip); call.resolve(r);
                BufferedReader br = new BufferedReader(new InputStreamReader(s.getInputStream(), StandardCharsets.UTF_8), 65536);
                String line;
                while (g == gen && (line = br.readLine()) != null) {
                    if (line.isEmpty()) continue;
                    JSObject o = new JSObject(); o.put("from", 0); o.put("data", line); emit("msg", o);
                }
                if (g == gen) { client = null; clientOut = null; emit("closed", new JSObject()); }
                try { s.close(); } catch (Exception ignored) { }
            } catch (Exception e) {
                if (client == null) call.reject("No room answered at " + ip + ". Check that both phones are on the same Wi-Fi.");
                else if (g == gen) { client = null; clientOut = null; emit("closed", new JSObject()); }
            }
        }, "ltm-client").start();
    }

    // ---------- gửi ----------
    @PluginMethod
    public void send(PluginCall call) {
        final String data = call.getString("data", "");
        final int to = call.getInt("to", -1);
        final byte[] b = (data + "\n").getBytes(StandardCharsets.UTF_8);
        final int g = gen;
        try {
            sender.execute(() -> {
                if (g != gen) return;
                if (server != null) {
                    if (to >= 0) { Conn c = conns.get(to); if (c != null) write(c, b); }
                    else for (Conn c : conns.values()) write(c, b);
                } else {
                    OutputStream o = clientOut;
                    if (o != null) { try { o.write(b); o.flush(); } catch (Exception e) { try { Socket s = client; if (s != null) s.close(); } catch (Exception ignored) { } } }
                }
            });
        } catch (Exception ignored) { }
        call.resolve();
    }

    private void write(Conn c, byte[] b) {
        try { c.out.write(b); c.out.flush(); }
        catch (Exception e) { try { c.sock.close(); } catch (Exception ignored) { } }
    }

    // ---------- đóng ----------
    private synchronized void shutdown() {
        gen++;
        beaconOn = false;
        stopScanInternal();
        ServerSocket ss = server; server = null;
        if (ss != null) { try { ss.close(); } catch (Exception ignored) { } }
        for (Conn c : conns.values()) { try { c.sock.close(); } catch (Exception ignored) { } }
        conns.clear();
        Socket s = client; client = null; clientOut = null;
        if (s != null) { try { s.close(); } catch (Exception ignored) { } }
    }

    @PluginMethod
    public void close(PluginCall call) { shutdown(); call.resolve(); }

    @Override
    protected void handleOnDestroy() { shutdown(); sender.shutdownNow(); super.handleOnDestroy(); }
}
