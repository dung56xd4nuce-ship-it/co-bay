import re,json,sys
VN=re.compile(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ]')
def js_strings(src):
    out=[]; i=0; n=len(src)
    while i<n:
        c=src[i]
        if c=='/' and i+1<n and src[i+1]=='/':
            j=src.find('\n',i); i=n if j<0 else j; continue
        if c=='/' and i+1<n and src[i+1]=='*':
            j=src.find('*/',i+2); i=n if j<0 else j+2; continue
        if c in '\'"`':
            q=c; j=i+1; depth=0
            while j<n:
                if src[j]=='\\': j+=2; continue
                if q=='`' and src[j]=='$' and j+1<n and src[j+1]=='{':
                    # skip ${...} with nesting
                    k=j+2; d=1
                    while k<n and d>0:
                        if src[k]=='{': d+=1
                        elif src[k]=='}': d-=1
                        elif src[k] in '\'"`':
                            qq=src[k]; k+=1
                            while k<n and src[k]!=qq:
                                if src[k]=='\\': k+=1
                                k+=1
                        k+=1
                    j=k; continue
                if src[j]==q: break
                if q!='`' and src[j]=='\n': break
                j+=1
            out.append((i,j+1,src[i:j+1])); i=j+1; continue
        i+=1
    return out
if __name__=='__main__':
    files=sys.argv[1:]; res={}
    for f in files:
        s=open(f).read()
        for a,b,t in js_strings(s):
            if VN.search(t): res.setdefault(t,[]).append(f)
    json.dump({k:sorted(set(v)) for k,v in res.items()},open('i18n/js_strings.json','w'),ensure_ascii=False,indent=0)
    print(len(res))
