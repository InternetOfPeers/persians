;(function(globalObj){'use strict';var BigNumber,cryptoObj,parseNumeric,isNumeric=/^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,mathceil=Math.ceil,mathfloor=Math.floor,notBool=' not a boolean or binary digit',roundingMode='rounding mode',tooManyDigits='number type has more than 15 significant digits',ALPHABET='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_',BASE=1e14,LOG_BASE=14,MAX_SAFE_INTEGER=0x1fffffffffffff,POWS_TEN=[1,10,100,1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e10,1e11,1e12,1e13],SQRT_BASE=1e7,MAX=1E9;if(typeof crypto!='undefined')cryptoObj=crypto;function constructorFactory(configObj){var div,id=0,P=BigNumber.prototype,ONE=new BigNumber(1),DECIMAL_PLACES=20,ROUNDING_MODE=4,TO_EXP_NEG=-7,TO_EXP_POS=21,MIN_EXP=-1e7,MAX_EXP=1e7,ERRORS=true,isValidInt=intValidatorWithErrors,CRYPTO=false,MODULO_MODE=1,POW_PRECISION=100,FORMAT={decimalSeparator:'.',groupSeparator:',',groupSize:3,secondaryGroupSize:0,fractionGroupSeparator:'\xA0',fractionGroupSize:0};function BigNumber(n,b){var c,e,i,num,len,str,x=this;if(!(x instanceof BigNumber)){if(ERRORS)raise(26,'constructor call without new',n);return new BigNumber(n,b);}
if(b==null||!isValidInt(b,2,64,id,'base')){if(n instanceof BigNumber){x.s=n.s;x.e=n.e;x.c=(n=n.c)?n.slice():n;id=0;return;}
if((num=typeof n=='number')&&n*0==0){x.s=1/n<0?(n=-n,-1):1;if(n===~~n){for(e=0,i=n;i>=10;i/=10,e++);x.e=e;x.c=[n];id=0;return;}
str=n+'';}else{if(!isNumeric.test(str=n+''))return parseNumeric(x,str,num);x.s=str.charCodeAt(0)===45?(str=str.slice(1),-1):1;}}else{b=b|0;str=n+'';if(b==10){x=new BigNumber(n instanceof BigNumber?n:str);return round(x,DECIMAL_PLACES+ x.e+ 1,ROUNDING_MODE);}
if((num=typeof n=='number')&&n*0!=0||!(new RegExp('^-?'+(c='['+ ALPHABET.slice(0,b)+']+')+'(?:\\.'+ c+')?$',b<37?'i':'')).test(str)){return parseNumeric(x,str,num,b);}
if(num){x.s=1/n<0?(str=str.slice(1),-1):1;if(ERRORS&&str.replace(/^0\.0*|\./,'').length>15){raise(id,tooManyDigits,n);}
num=false;}else{x.s=str.charCodeAt(0)===45?(str=str.slice(1),-1):1;}
str=convertBase(str,10,b,x.s);}
if((e=str.indexOf('.'))>-1)str=str.replace('.','');if((i=str.search(/e/i))>0){if(e<0)e=i;e+=+str.slice(i+ 1);str=str.substring(0,i);}else if(e<0){e=str.length;}
for(i=0;str.charCodeAt(i)===48;i++);for(len=str.length;str.charCodeAt(--len)===48;);str=str.slice(i,len+ 1);if(str){len=str.length;if(num&&ERRORS&&len>15&&(n>MAX_SAFE_INTEGER||n!==mathfloor(n))){raise(id,tooManyDigits,x.s*n);}
e=e- i- 1;if(e>MAX_EXP){x.c=x.e=null;}else if(e<MIN_EXP){x.c=[x.e=0];}else{x.e=e;x.c=[];i=(e+ 1)%LOG_BASE;if(e<0)i+=LOG_BASE;if(i<len){if(i)x.c.push(+str.slice(0,i));for(len-=LOG_BASE;i<len;){x.c.push(+str.slice(i,i+=LOG_BASE));}
str=str.slice(i);i=LOG_BASE- str.length;}else{i-=len;}
for(;i--;str+='0');x.c.push(+str);}}else{x.c=[x.e=0];}
id=0;}
BigNumber.another=constructorFactory;BigNumber.ROUND_UP=0;BigNumber.ROUND_DOWN=1;BigNumber.ROUND_CEIL=2;BigNumber.ROUND_FLOOR=3;BigNumber.ROUND_HALF_UP=4;BigNumber.ROUND_HALF_DOWN=5;BigNumber.ROUND_HALF_EVEN=6;BigNumber.ROUND_HALF_CEIL=7;BigNumber.ROUND_HALF_FLOOR=8;BigNumber.EUCLID=9;BigNumber.config=function(){var v,p,i=0,r={},a=arguments,o=a[0],has=o&&typeof o=='object'?function(){if(o.hasOwnProperty(p))return(v=o[p])!=null;}:function(){if(a.length>i)return(v=a[i++])!=null;};if(has(p='DECIMAL_PLACES')&&isValidInt(v,0,MAX,2,p)){DECIMAL_PLACES=v|0;}
r[p]=DECIMAL_PLACES;if(has(p='ROUNDING_MODE')&&isValidInt(v,0,8,2,p)){ROUNDING_MODE=v|0;}
r[p]=ROUNDING_MODE;if(has(p='EXPONENTIAL_AT')){if(isArray(v)){if(isValidInt(v[0],-MAX,0,2,p)&&isValidInt(v[1],0,MAX,2,p)){TO_EXP_NEG=v[0]|0;TO_EXP_POS=v[1]|0;}}else if(isValidInt(v,-MAX,MAX,2,p)){TO_EXP_NEG=-(TO_EXP_POS=(v<0?-v:v)|0);}}
r[p]=[TO_EXP_NEG,TO_EXP_POS];if(has(p='RANGE')){if(isArray(v)){if(isValidInt(v[0],-MAX,-1,2,p)&&isValidInt(v[1],1,MAX,2,p)){MIN_EXP=v[0]|0;MAX_EXP=v[1]|0;}}else if(isValidInt(v,-MAX,MAX,2,p)){if(v|0)MIN_EXP=-(MAX_EXP=(v<0?-v:v)|0);else if(ERRORS)raise(2,p+' cannot be zero',v);}}
r[p]=[MIN_EXP,MAX_EXP];if(has(p='ERRORS')){if(v===!!v||v===1||v===0){id=0;isValidInt=(ERRORS=!!v)?intValidatorWithErrors:intValidatorNoErrors;}else if(ERRORS){raise(2,p+ notBool,v);}}
r[p]=ERRORS;if(has(p='CRYPTO')){if(v===!!v||v===1||v===0){CRYPTO=!!(v&&cryptoObj);if(v&&!CRYPTO&&ERRORS)raise(2,'crypto unavailable',cryptoObj);}else if(ERRORS){raise(2,p+ notBool,v);}}
r[p]=CRYPTO;if(has(p='MODULO_MODE')&&isValidInt(v,0,9,2,p)){MODULO_MODE=v|0;}
r[p]=MODULO_MODE;if(has(p='POW_PRECISION')&&isValidInt(v,0,MAX,2,p)){POW_PRECISION=v|0;}
r[p]=POW_PRECISION;if(has(p='FORMAT')){if(typeof v=='object'){FORMAT=v;}else if(ERRORS){raise(2,p+' not an object',v);}}
r[p]=FORMAT;return r;};BigNumber.max=function(){return maxOrMin(arguments,P.lt);};BigNumber.min=function(){return maxOrMin(arguments,P.gt);};BigNumber.random=(function(){var pow2_53=0x20000000000000;var random53bitInt=(Math.random()*pow2_53)&0x1fffff?function(){return mathfloor(Math.random()*pow2_53);}:function(){return((Math.random()*0x40000000|0)*0x800000)+
(Math.random()*0x800000|0);};return function(dp){var a,b,e,k,v,i=0,c=[],rand=new BigNumber(ONE);dp=dp==null||!isValidInt(dp,0,MAX,14)?DECIMAL_PLACES:dp|0;k=mathceil(dp/LOG_BASE);if(CRYPTO){if(cryptoObj&&cryptoObj.getRandomValues){a=cryptoObj.getRandomValues(new Uint32Array(k*=2));for(;i<k;){v=a[i]*0x20000+(a[i+ 1]>>>11);if(v>=9e15){b=cryptoObj.getRandomValues(new Uint32Array(2));a[i]=b[0];a[i+ 1]=b[1];}else{c.push(v%1e14);i+=2;}}
i=k/2;}else if(cryptoObj&&cryptoObj.randomBytes){a=cryptoObj.randomBytes(k*=7);for(;i<k;){v=((a[i]&31)*0x1000000000000)+(a[i+ 1]*0x10000000000)+
(a[i+ 2]*0x100000000)+(a[i+ 3]*0x1000000)+
(a[i+ 4]<<16)+(a[i+ 5]<<8)+ a[i+ 6];if(v>=9e15){cryptoObj.randomBytes(7).copy(a,i);}else{c.push(v%1e14);i+=7;}}
i=k/7;}else if(ERRORS){raise(14,'crypto unavailable',cryptoObj);}}
if(!i){for(;i<k;){v=random53bitInt();if(v<9e15)c[i++]=v%1e14;}}
k=c[--i];dp%=LOG_BASE;if(k&&dp){v=POWS_TEN[LOG_BASE- dp];c[i]=mathfloor(k/v)*v;}
for(;c[i]===0;c.pop(),i--);if(i<0){c=[e=0];}else{for(e=-1;c[0]===0;c.shift(),e-=LOG_BASE);for(i=1,v=c[0];v>=10;v/=10,i++);if(i<LOG_BASE)e-=LOG_BASE- i;}
rand.e=e;rand.c=c;return rand;};})();function convertBase(str,baseOut,baseIn,sign){var d,e,k,r,x,xc,y,i=str.indexOf('.'),dp=DECIMAL_PLACES,rm=ROUNDING_MODE;if(baseIn<37)str=str.toLowerCase();if(i>=0){k=POW_PRECISION;POW_PRECISION=0;str=str.replace('.','');y=new BigNumber(baseIn);x=y.pow(str.length- i);POW_PRECISION=k;y.c=toBaseOut(toFixedPoint(coeffToString(x.c),x.e),10,baseOut);y.e=y.c.length;}
xc=toBaseOut(str,baseIn,baseOut);e=k=xc.length;for(;xc[--k]==0;xc.pop());if(!xc[0])return'0';if(i<0){--e;}else{x.c=xc;x.e=e;x.s=sign;x=div(x,y,dp,rm,baseOut);xc=x.c;r=x.r;e=x.e;}
d=e+ dp+ 1;i=xc[d];k=baseOut/2;r=r||d<0||xc[d+ 1]!=null;r=rm<4?(i!=null||r)&&(rm==0||rm==(x.s<0?3:2)):i>k||i==k&&(rm==4||r||rm==6&&xc[d- 1]&1||rm==(x.s<0?8:7));if(d<1||!xc[0]){str=r?toFixedPoint('1',-dp):'0';}else{xc.length=d;if(r){for(--baseOut;++xc[--d]>baseOut;){xc[d]=0;if(!d){++e;xc.unshift(1);}}}
for(k=xc.length;!xc[--k];);for(i=0,str='';i<=k;str+=ALPHABET.charAt(xc[i++]));str=toFixedPoint(str,e);}
return str;}
div=(function(){function multiply(x,k,base){var m,temp,xlo,xhi,carry=0,i=x.length,klo=k%SQRT_BASE,khi=k/SQRT_BASE|0;for(x=x.slice();i--;){xlo=x[i]%SQRT_BASE;xhi=x[i]/SQRT_BASE|0;m=khi*xlo+ xhi*klo;temp=klo*xlo+((m%SQRT_BASE)*SQRT_BASE)+ carry;carry=(temp/base|0)+(m/SQRT_BASE|0)+ khi*xhi;x[i]=temp%base;}
if(carry)x.unshift(carry);return x;}
function compare(a,b,aL,bL){var i,cmp;if(aL!=bL){cmp=aL>bL?1:-1;}else{for(i=cmp=0;i<aL;i++){if(a[i]!=b[i]){cmp=a[i]>b[i]?1:-1;break;}}}
return cmp;}
function subtract(a,b,aL,base){var i=0;for(;aL--;){a[aL]-=i;i=a[aL]<b[aL]?1:0;a[aL]=i*base+ a[aL]- b[aL];}
for(;!a[0]&&a.length>1;a.shift());}
return function(x,y,dp,rm,base){var cmp,e,i,more,n,prod,prodL,q,qc,rem,remL,rem0,xi,xL,yc0,yL,yz,s=x.s==y.s?1:-1,xc=x.c,yc=y.c;if(!xc||!xc[0]||!yc||!yc[0]){return new BigNumber(!x.s||!y.s||(xc?yc&&xc[0]==yc[0]:!yc)?NaN:xc&&xc[0]==0||!yc?s*0:s/0);}
q=new BigNumber(s);qc=q.c=[];e=x.e- y.e;s=dp+ e+ 1;if(!base){base=BASE;e=bitFloor(x.e/LOG_BASE)- bitFloor(y.e/LOG_BASE);s=s/LOG_BASE|0;}
for(i=0;yc[i]==(xc[i]||0);i++);if(yc[i]>(xc[i]||0))e--;if(s<0){qc.push(1);more=true;}else{xL=xc.length;yL=yc.length;i=0;s+=2;n=mathfloor(base/(yc[0]+ 1));if(n>1){yc=multiply(yc,n,base);xc=multiply(xc,n,base);yL=yc.length;xL=xc.length;}
xi=yL;rem=xc.slice(0,yL);remL=rem.length;for(;remL<yL;rem[remL++]=0);yz=yc.slice();yz.unshift(0);yc0=yc[0];if(yc[1]>=base/2)yc0++;do{n=0;cmp=compare(yc,rem,yL,remL);if(cmp<0){rem0=rem[0];if(yL!=remL)rem0=rem0*base+(rem[1]||0);n=mathfloor(rem0/yc0);if(n>1){if(n>=base)n=base- 1;prod=multiply(yc,n,base);prodL=prod.length;remL=rem.length;while(compare(prod,rem,prodL,remL)==1){n--;subtract(prod,yL<prodL?yz:yc,prodL,base);prodL=prod.length;cmp=1;}}else{if(n==0){cmp=n=1;}
prod=yc.slice();prodL=prod.length;}
if(prodL<remL)prod.unshift(0);subtract(rem,prod,remL,base);remL=rem.length;if(cmp==-1){while(compare(yc,rem,yL,remL)<1){n++;subtract(rem,yL<remL?yz:yc,remL,base);remL=rem.length;}}}else if(cmp===0){n++;rem=[0];}
qc[i++]=n;if(rem[0]){rem[remL++]=xc[xi]||0;}else{rem=[xc[xi]];remL=1;}}while((xi++<xL||rem[0]!=null)&&s--);more=rem[0]!=null;if(!qc[0])qc.shift();}
if(base==BASE){for(i=1,s=qc[0];s>=10;s/=10,i++);round(q,dp+(q.e=i+ e*LOG_BASE- 1)+ 1,rm,more);}else{q.e=e;q.r=+more;}
return q;};})();function format(n,i,rm,caller){var c0,e,ne,len,str;rm=rm!=null&&isValidInt(rm,0,8,caller,roundingMode)?rm|0:ROUNDING_MODE;if(!n.c)return n.toString();c0=n.c[0];ne=n.e;if(i==null){str=coeffToString(n.c);str=caller==19||caller==24&&ne<=TO_EXP_NEG?toExponential(str,ne):toFixedPoint(str,ne);}else{n=round(new BigNumber(n),i,rm);e=n.e;str=coeffToString(n.c);len=str.length;if(caller==19||caller==24&&(i<=e||e<=TO_EXP_NEG)){for(;len<i;str+='0',len++);str=toExponential(str,e);}else{i-=ne;str=toFixedPoint(str,e);if(e+ 1>len){if(--i>0)for(str+='.';i--;str+='0');}else{i+=e- len;if(i>0){if(e+ 1==len)str+='.';for(;i--;str+='0');}}}}
return n.s<0&&c0?'-'+ str:str;}
function maxOrMin(args,method){var m,n,i=0;if(isArray(args[0]))args=args[0];m=new BigNumber(args[0]);for(;++i<args.length;){n=new BigNumber(args[i]);if(!n.s){m=n;break;}else if(method.call(m,n)){m=n;}}
return m;}
function intValidatorWithErrors(n,min,max,caller,name){if(n<min||n>max||n!=truncate(n)){raise(caller,(name||'decimal places')+
(n<min||n>max?' out of range':' not an integer'),n);}
return true;}
function normalise(n,c,e){var i=1,j=c.length;for(;!c[--j];c.pop());for(j=c[0];j>=10;j/=10,i++);if((e=i+ e*LOG_BASE- 1)>MAX_EXP){n.c=n.e=null;}else if(e<MIN_EXP){n.c=[n.e=0];}else{n.e=e;n.c=c;}
return n;}
parseNumeric=(function(){var basePrefix=/^(-?)0([xbo])(?=\w[\w.]*$)/i,dotAfter=/^([^.]+)\.$/,dotBefore=/^\.([^.]+)$/,isInfinityOrNaN=/^-?(Infinity|NaN)$/,whitespaceOrPlus=/^\s*\+(?=[\w.])|^\s+|\s+$/g;return function(x,str,num,b){var base,s=num?str:str.replace(whitespaceOrPlus,'');if(isInfinityOrNaN.test(s)){x.s=isNaN(s)?null:s<0?-1:1;}else{if(!num){s=s.replace(basePrefix,function(m,p1,p2){base=(p2=p2.toLowerCase())=='x'?16:p2=='b'?2:8;return!b||b==base?p1:m;});if(b){base=b;s=s.replace(dotAfter,'$1').replace(dotBefore,'0.$1');}
if(str!=s)return new BigNumber(s,base);}
if(ERRORS)raise(id,'not a'+(b?' base '+ b:'')+' number',str);x.s=null;}
x.c=x.e=null;id=0;}})();function raise(caller,msg,val){var error=new Error(['new BigNumber','cmp','config','div','divToInt','eq','gt','gte','lt','lte','minus','mod','plus','precision','random','round','shift','times','toDigits','toExponential','toFixed','toFormat','toFraction','pow','toPrecision','toString','BigNumber'][caller]+'() '+ msg+': '+ val);error.name='BigNumber Error';id=0;throw error;}
function round(x,sd,rm,r){var d,i,j,k,n,ni,rd,xc=x.c,pows10=POWS_TEN;if(xc){out:{for(d=1,k=xc[0];k>=10;k/=10,d++);i=sd- d;if(i<0){i+=LOG_BASE;j=sd;n=xc[ni=0];rd=n/pows10[d- j- 1]%10|0;}else{ni=mathceil((i+ 1)/ LOG_BASE );
if(ni>=xc.length){if(r){for(;xc.length<=ni;xc.push(0));n=rd=0;d=1;i%=LOG_BASE;j=i- LOG_BASE+ 1;}else{break out;}}else{n=k=xc[ni];for(d=1;k>=10;k/=10,d++);i%=LOG_BASE;j=i- LOG_BASE+ d;rd=j<0?0:n/pows10[d- j- 1]%10|0;}}
r=r||sd<0||xc[ni+ 1]!=null||(j<0?n:n%pows10[d- j- 1]);r=rm<4?(rd||r)&&(rm==0||rm==(x.s<0?3:2)):rd>5||rd==5&&(rm==4||r||rm==6&&((i>0?j>0?n/pows10[d- j]:0:xc[ni- 1])%10)&1||rm==(x.s<0?8:7));if(sd<1||!xc[0]){xc.length=0;if(r){sd-=x.e+ 1;xc[0]=pows10[(LOG_BASE- sd%LOG_BASE)%LOG_BASE];x.e=-sd||0;}else{xc[0]=x.e=0;}
return x;}
if(i==0){xc.length=ni;k=1;ni--;}else{xc.length=ni+ 1;k=pows10[LOG_BASE- i];xc[ni]=j>0?mathfloor(n/pows10[d- j]%pows10[j])*k:0;}
if(r){for(;;){if(ni==0){for(i=1,j=xc[0];j>=10;j/=10,i++);j=xc[0]+=k;for(k=1;j>=10;j/=10,k++);if(i!=k){x.e++;if(xc[0]==BASE)xc[0]=1;}
break;}else{xc[ni]+=k;if(xc[ni]!=BASE)break;xc[ni--]=0;k=1;}}}
for(i=xc.length;xc[--i]===0;xc.pop());}
if(x.e>MAX_EXP){x.c=x.e=null;}else if(x.e<MIN_EXP){x.c=[x.e=0];}}
return x;}
P.absoluteValue=P.abs=function(){var x=new BigNumber(this);if(x.s<0)x.s=1;return x;};P.ceil=function(){return round(new BigNumber(this),this.e+ 1,2);};P.comparedTo=P.cmp=function(y,b){id=1;return compare(this,new BigNumber(y,b));};P.decimalPlaces=P.dp=function(){var n,v,c=this.c;if(!c)return null;n=((v=c.length- 1)- bitFloor(this.e/LOG_BASE))*LOG_BASE;if(v=c[v])for(;v%10==0;v/=10,n--);if(n<0)n=0;return n;};P.dividedBy=P.div=function(y,b){id=3;return div(this,new BigNumber(y,b),DECIMAL_PLACES,ROUNDING_MODE);};P.dividedToIntegerBy=P.divToInt=function(y,b){id=4;return div(this,new BigNumber(y,b),0,1);};P.equals=P.eq=function(y,b){id=5;return compare(this,new BigNumber(y,b))===0;};P.floor=function(){return round(new BigNumber(this),this.e+ 1,3);};P.greaterThan=P.gt=function(y,b){id=6;return compare(this,new BigNumber(y,b))>0;};P.greaterThanOrEqualTo=P.gte=function(y,b){id=7;return(b=compare(this,new BigNumber(y,b)))===1||b===0;};P.isFinite=function(){return!!this.c;};P.isInteger=P.isInt=function(){return!!this.c&&bitFloor(this.e/LOG_BASE)>this.c.length- 2;};P.isNaN=function(){return!this.s;};P.isNegative=P.isNeg=function(){return this.s<0;};P.isZero=function(){return!!this.c&&this.c[0]==0;};P.lessThan=P.lt=function(y,b){id=8;return compare(this,new BigNumber(y,b))<0;};P.lessThanOrEqualTo=P.lte=function(y,b){id=9;return(b=compare(this,new BigNumber(y,b)))===-1||b===0;};P.minus=P.sub=function(y,b){var i,j,t,xLTy,x=this,a=x.s;id=10;y=new BigNumber(y,b);b=y.s;if(!a||!b)return new BigNumber(NaN);if(a!=b){y.s=-b;return x.plus(y);}
var xe=x.e/LOG_BASE,ye=y.e/LOG_BASE,xc=x.c,yc=y.c;if(!xe||!ye){if(!xc||!yc)return xc?(y.s=-b,y):new BigNumber(yc?x:NaN);if(!xc[0]||!yc[0]){return yc[0]?(y.s=-b,y):new BigNumber(xc[0]?x:ROUNDING_MODE==3?-0:0);}}
xe=bitFloor(xe);ye=bitFloor(ye);xc=xc.slice();if(a=xe- ye){if(xLTy=a<0){a=-a;t=xc;}else{ye=xe;t=yc;}
t.reverse();for(b=a;b--;t.push(0));t.reverse();}else{j=(xLTy=(a=xc.length)<(b=yc.length))?a:b;for(a=b=0;b<j;b++){if(xc[b]!=yc[b]){xLTy=xc[b]<yc[b];break;}}}
if(xLTy)t=xc,xc=yc,yc=t,y.s=-y.s;b=(j=yc.length)-(i=xc.length);if(b>0)for(;b--;xc[i++]=0);b=BASE- 1;for(;j>a;){if(xc[--j]<yc[j]){for(i=j;i&&!xc[--i];xc[i]=b);--xc[i];xc[j]+=BASE;}
xc[j]-=yc[j];}
for(;xc[0]==0;xc.shift(),--ye);if(!xc[0]){y.s=ROUNDING_MODE==3?-1:1;y.c=[y.e=0];return y;}
return normalise(y,xc,ye);};P.modulo=P.mod=function(y,b){var q,s,x=this;id=11;y=new BigNumber(y,b);if(!x.c||!y.s||y.c&&!y.c[0]){return new BigNumber(NaN);}else if(!y.c||x.c&&!x.c[0]){return new BigNumber(x);}
if(MODULO_MODE==9){s=y.s;y.s=1;q=div(x,y,0,3);y.s=s;q.s*=s;}else{q=div(x,y,0,MODULO_MODE);}
return x.minus(q.times(y));};P.negated=P.neg=function(){var x=new BigNumber(this);x.s=-x.s||null;return x;};P.plus=P.add=function(y,b){var t,x=this,a=x.s;id=12;y=new BigNumber(y,b);b=y.s;if(!a||!b)return new BigNumber(NaN);if(a!=b){y.s=-b;return x.minus(y);}
var xe=x.e/LOG_BASE,ye=y.e/LOG_BASE,xc=x.c,yc=y.c;if(!xe||!ye){if(!xc||!yc)return new BigNumber(a/0);if(!xc[0]||!yc[0])return yc[0]?y:new BigNumber(xc[0]?x:a*0);}
xe=bitFloor(xe);ye=bitFloor(ye);xc=xc.slice();if(a=xe- ye){if(a>0){ye=xe;t=yc;}else{a=-a;t=xc;}
t.reverse();for(;a--;t.push(0));t.reverse();}
a=xc.length;b=yc.length;if(a- b<0)t=yc,yc=xc,xc=t,b=a;for(a=0;b;){a=(xc[--b]=xc[b]+ yc[b]+ a)/ BASE | 0;
xc[b]%=BASE;}
if(a){xc.unshift(a);++ye;}
return normalise(y,xc,ye);};P.precision=P.sd=function(z){var n,v,x=this,c=x.c;if(z!=null&&z!==!!z&&z!==1&&z!==0){if(ERRORS)raise(13,'argument'+ notBool,z);if(z!=!!z)z=null;}
if(!c)return null;v=c.length- 1;n=v*LOG_BASE+ 1;if(v=c[v]){for(;v%10==0;v/=10,n--);for(v=c[0];v>=10;v/=10,n++);}
if(z&&x.e+ 1>n)n=x.e+ 1;return n;};P.round=function(dp,rm){var n=new BigNumber(this);if(dp==null||isValidInt(dp,0,MAX,15)){round(n,~~dp+ this.e+ 1,rm==null||!isValidInt(rm,0,8,15,roundingMode)?ROUNDING_MODE:rm|0);}
return n;};P.shift=function(k){var n=this;return isValidInt(k,-MAX_SAFE_INTEGER,MAX_SAFE_INTEGER,16,'argument')?n.times('1e'+ truncate(k)):new BigNumber(n.c&&n.c[0]&&(k<-MAX_SAFE_INTEGER||k>MAX_SAFE_INTEGER)?n.s*(k<0?0:1/0):n);};P.squareRoot=P.sqrt=function(){var m,n,r,rep,t,x=this,c=x.c,s=x.s,e=x.e,dp=DECIMAL_PLACES+ 4,half=new BigNumber('0.5');if(s!==1||!c||!c[0]){return new BigNumber(!s||s<0&&(!c||c[0])?NaN:c?x:1/0);}
s=Math.sqrt(+x);if(s==0||s==1/0){n=coeffToString(c);if((n.length+ e)%2==0)n+='0';s=Math.sqrt(n);e=bitFloor((e+ 1)/ 2 ) - ( e < 0 || e % 2 );
if(s==1/0){n='1e'+ e;}else{n=s.toExponential();n=n.slice(0,n.indexOf('e')+ 1)+ e;}
r=new BigNumber(n);}else{r=new BigNumber(s+'');}
if(r.c[0]){e=r.e;s=e+ dp;if(s<3)s=0;for(;;){t=r;r=half.times(t.plus(div(x,t,dp,1)));if(coeffToString(t.c).slice(0,s)===(n=coeffToString(r.c)).slice(0,s)){if(r.e<e)--s;n=n.slice(s- 3,s+ 1);if(n=='9999'||!rep&&n=='4999'){if(!rep){round(t,t.e+ DECIMAL_PLACES+ 2,0);if(t.times(t).eq(x)){r=t;break;}}
dp+=4;s+=4;rep=1;}else{if(!+n||!+n.slice(1)&&n.charAt(0)=='5'){round(r,r.e+ DECIMAL_PLACES+ 2,1);m=!r.times(r).eq(x);}
break;}}}}
return round(r,r.e+ DECIMAL_PLACES+ 1,ROUNDING_MODE,m);};P.times=P.mul=function(y,b){var c,e,i,j,k,m,xcL,xlo,xhi,ycL,ylo,yhi,zc,base,sqrtBase,x=this,xc=x.c,yc=(id=17,y=new BigNumber(y,b)).c;if(!xc||!yc||!xc[0]||!yc[0]){if(!x.s||!y.s||xc&&!xc[0]&&!yc||yc&&!yc[0]&&!xc){y.c=y.e=y.s=null;}else{y.s*=x.s;if(!xc||!yc){y.c=y.e=null;}else{y.c=[0];y.e=0;}}
return y;}
e=bitFloor(x.e/LOG_BASE)+ bitFloor(y.e/LOG_BASE);y.s*=x.s;xcL=xc.length;ycL=yc.length;if(xcL<ycL)zc=xc,xc=yc,yc=zc,i=xcL,xcL=ycL,ycL=i;for(i=xcL+ ycL,zc=[];i--;zc.push(0));base=BASE;sqrtBase=SQRT_BASE;for(i=ycL;--i>=0;){c=0;ylo=yc[i]%sqrtBase;yhi=yc[i]/sqrtBase|0;for(k=xcL,j=i+ k;j>i;){xlo=xc[--k]%sqrtBase;xhi=xc[k]/sqrtBase|0;m=yhi*xlo+ xhi*ylo;xlo=ylo*xlo+((m%sqrtBase)*sqrtBase)+ zc[j]+ c;c=(xlo/base|0)+(m/sqrtBase|0)+ yhi*xhi;zc[j--]=xlo%base;}
zc[j]=c;}
if(c){++e;}else{zc.shift();}
return normalise(y,zc,e);};P.toDigits=function(sd,rm){var n=new BigNumber(this);sd=sd==null||!isValidInt(sd,1,MAX,18,'precision')?null:sd|0;rm=rm==null||!isValidInt(rm,0,8,18,roundingMode)?ROUNDING_MODE:rm|0;return sd?round(n,sd,rm):n;};P.toExponential=function(dp,rm){return format(this,dp!=null&&isValidInt(dp,0,MAX,19)?~~dp+ 1:null,rm,19);};P.toFixed=function(dp,rm){return format(this,dp!=null&&isValidInt(dp,0,MAX,20)?~~dp+ this.e+ 1:null,rm,20);};P.toFormat=function(dp,rm){var str=format(this,dp!=null&&isValidInt(dp,0,MAX,21)?~~dp+ this.e+ 1:null,rm,21);if(this.c){var i,arr=str.split('.'),g1=+FORMAT.groupSize,g2=+FORMAT.secondaryGroupSize,groupSeparator=FORMAT.groupSeparator,intPart=arr[0],fractionPart=arr[1],isNeg=this.s<0,intDigits=isNeg?intPart.slice(1):intPart,len=intDigits.length;if(g2)i=g1,g1=g2,g2=i,len-=i;if(g1>0&&len>0){i=len%g1||g1;intPart=intDigits.substr(0,i);for(;i<len;i+=g1){intPart+=groupSeparator+ intDigits.substr(i,g1);}
if(g2>0)intPart+=groupSeparator+ intDigits.slice(i);if(isNeg)intPart='-'+ intPart;}
str=fractionPart?intPart+ FORMAT.decimalSeparator+((g2=+FORMAT.fractionGroupSize)?fractionPart.replace(new RegExp('\\d{'+ g2+'}\\B','g'),'$&'+ FORMAT.fractionGroupSeparator):fractionPart):intPart;}
return str;};P.toFraction=function(md){var arr,d0,d2,e,exp,n,n0,q,s,k=ERRORS,x=this,xc=x.c,d=new BigNumber(ONE),n1=d0=new BigNumber(ONE),d1=n0=new BigNumber(ONE);if(md!=null){ERRORS=false;n=new BigNumber(md);ERRORS=k;if(!(k=n.isInt())||n.lt(ONE)){if(ERRORS){raise(22,'max denominator '+(k?'out of range':'not an integer'),md);}
md=!k&&n.c&&round(n,n.e+ 1,1).gte(ONE)?n:null;}}
if(!xc)return x.toString();s=coeffToString(xc);e=d.e=s.length- x.e- 1;d.c[0]=POWS_TEN[(exp=e%LOG_BASE)<0?LOG_BASE+ exp:exp];md=!md||n.cmp(d)>0?(e>0?d:n1):n;exp=MAX_EXP;MAX_EXP=1/0;n=new BigNumber(s);n0.c[0]=0;for(;;){q=div(n,d,0,1);d2=d0.plus(q.times(d1));if(d2.cmp(md)==1)break;d0=d1;d1=d2;n1=n0.plus(q.times(d2=n1));n0=d2;d=n.minus(q.times(d2=d));n=d2;}
d2=div(md.minus(d0),d1,0,1);n0=n0.plus(d2.times(n1));d0=d0.plus(d2.times(d1));n0.s=n1.s=x.s;e*=2;arr=div(n1,d1,e,ROUNDING_MODE).minus(x).abs().cmp(div(n0,d0,e,ROUNDING_MODE).minus(x).abs())<1?[n1.toString(),d1.toString()]:[n0.toString(),d0.toString()];MAX_EXP=exp;return arr;};P.toNumber=function(){return+this;};P.toPower=P.pow=function(n,m){var k,y,z,i=mathfloor(n<0?-n:+n),x=this;if(m!=null){id=23;m=new BigNumber(m);}
if(!isValidInt(n,-MAX_SAFE_INTEGER,MAX_SAFE_INTEGER,23,'exponent')&&(!isFinite(n)||i>MAX_SAFE_INTEGER&&(n/=0)||parseFloat(n)!=n&&!(n=NaN))||n==0){k=Math.pow(+x,n);return new BigNumber(m?k%m:k);}
if(m){if(n>1&&x.gt(ONE)&&x.isInt()&&m.gt(ONE)&&m.isInt()){x=x.mod(m);}else{z=m;m=null;}}else if(POW_PRECISION){k=mathceil(POW_PRECISION/LOG_BASE+ 2);}
y=new BigNumber(ONE);for(;;){if(i%2){y=y.times(x);if(!y.c)break;if(k){if(y.c.length>k)y.c.length=k;}else if(m){y=y.mod(m);}}
i=mathfloor(i/2);if(!i)break;x=x.times(x);if(k){if(x.c&&x.c.length>k)x.c.length=k;}else if(m){x=x.mod(m);}}
if(m)return y;if(n<0)y=ONE.div(y);return z?y.mod(z):k?round(y,POW_PRECISION,ROUNDING_MODE):y;};P.toPrecision=function(sd,rm){return format(this,sd!=null&&isValidInt(sd,1,MAX,24,'precision')?sd|0:null,rm,24);};P.toString=function(b){var str,n=this,s=n.s,e=n.e;if(e===null){if(s){str='Infinity';if(s<0)str='-'+ str;}else{str='NaN';}}else{str=coeffToString(n.c);if(b==null||!isValidInt(b,2,64,25,'base')){str=e<=TO_EXP_NEG||e>=TO_EXP_POS?toExponential(str,e):toFixedPoint(str,e);}else{str=convertBase(toFixedPoint(str,e),b|0,10,s);}
if(s<0&&n.c[0])str='-'+ str;}
return str;};P.truncated=P.trunc=function(){return round(new BigNumber(this),this.e+ 1,1);};P.valueOf=P.toJSON=function(){var str,n=this,e=n.e;if(e===null)return n.toString();str=coeffToString(n.c);str=e<=TO_EXP_NEG||e>=TO_EXP_POS?toExponential(str,e):toFixedPoint(str,e);return n.s<0?'-'+ str:str;};if(configObj!=null)BigNumber.config(configObj);return BigNumber;}
function bitFloor(n){var i=n|0;return n>0||n===i?i:i- 1;}
function coeffToString(a){var s,z,i=1,j=a.length,r=a[0]+'';for(;i<j;){s=a[i++]+'';z=LOG_BASE- s.length;for(;z--;s='0'+ s);r+=s;}
for(j=r.length;r.charCodeAt(--j)===48;);return r.slice(0,j+ 1||1);}
function compare(x,y){var a,b,xc=x.c,yc=y.c,i=x.s,j=y.s,k=x.e,l=y.e;if(!i||!j)return null;a=xc&&!xc[0];b=yc&&!yc[0];if(a||b)return a?b?0:-j:i;if(i!=j)return i;a=i<0;b=k==l;if(!xc||!yc)return b?0:!xc^a?1:-1;if(!b)return k>l^a?1:-1;j=(k=xc.length)<(l=yc.length)?k:l;for(i=0;i<j;i++)if(xc[i]!=yc[i])return xc[i]>yc[i]^a?1:-1;return k==l?0:k>l^a?1:-1;}
function intValidatorNoErrors(n,min,max){return(n=truncate(n))>=min&&n<=max;}
function isArray(obj){return Object.prototype.toString.call(obj)=='[object Array]';}
function toBaseOut(str,baseIn,baseOut){var j,arr=[0],arrL,i=0,len=str.length;for(;i<len;){for(arrL=arr.length;arrL--;arr[arrL]*=baseIn);arr[j=0]+=ALPHABET.indexOf(str.charAt(i++));for(;j<arr.length;j++){if(arr[j]>baseOut- 1){if(arr[j+ 1]==null)arr[j+ 1]=0;arr[j+ 1]+=arr[j]/baseOut|0;arr[j]%=baseOut;}}}
return arr.reverse();}
function toExponential(str,e){return(str.length>1?str.charAt(0)+'.'+ str.slice(1):str)+
(e<0?'e':'e+')+ e;}
function toFixedPoint(str,e){var len,z;if(e<0){for(z='0.';++e;z+='0');str=z+ str;}else{len=str.length;if(++e>len){for(z='0',e-=len;--e;z+='0');str+=z;}else if(e<len){str=str.slice(0,e)+'.'+ str.slice(e);}}
return str;}
function truncate(n){n=parseFloat(n);return n<0?mathceil(n):mathfloor(n);}
BigNumber=constructorFactory();BigNumber.default=BigNumber.BigNumber=BigNumber;if(typeof define=='function'&&define.amd){define(function(){return BigNumber;});}else if(typeof module!='undefined'&&module.exports){module.exports=BigNumber;if(!cryptoObj)try{cryptoObj=require('cry'+'pto');}catch(e){}}else{if(!globalObj)globalObj=typeof self!='undefined'?self:Function('return this')();globalObj.BigNumber=BigNumber;}})(this);