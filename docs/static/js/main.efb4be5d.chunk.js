(this["webpackJsonpdrawing-sample"]=this["webpackJsonpdrawing-sample"]||[]).push([[0],{76:function(e,t,n){"use strict";n.r(t);var c,r,i,o,a=n(0),u=n.n(a),s=n(54),b=n.n(s),l=n(57),d=n(110),j=n(114),f=n(6),O=n(1),x=Object(a.createContext)(void 0),v=function(e){var t=e.children,n=Object(a.useState)("select"),c=Object(f.a)(n,2),r=c[0],i=c[1];return Object(O.jsx)(x.Provider,{value:{tool:r,setTool:i},children:t})},h=n(8),g=n(111),m={unit:{force:"kN",length:"m"},nodes:[],beams:[],forces:[],trapezoids:[]},p=n(26),S=n(10),y=n(15),C=function(e){return JSON.parse(JSON.stringify(e))},w=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:3,n=Math.pow(10,t),c=Math.round(e*n)/n;return c},E=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:25,n=e/t,c=Math.round(n)*t;return c},k=function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1],r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:25;return[E(n,r),E(c,r)]},I=n(106),z=function(e,t){return{id:Object(I.a)(),x:e,y:t}},M=n(30),N=n.n(M),_=function(e,t){var n=t.clone().subtract(e).normalize();return new N.a(n.y,-1*n.x).normalize()},F=function(e){var t=e.disabled,n=void 0!==t&&t,c=e.snapSize,r=void 0===c?25:c,i=e.structure,o=e.setStructure,u=Object(a.useState)([]),s=Object(f.a)(u,2),b=s[0],l=s[1],d=Object(a.useRef)(!1),j=Object(a.useCallback)((function(e){var t;if(!n){var c=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();c&&(d.current=!0,l([c.x,c.y]))}}),[n]),O=Object(a.useCallback)((function(e){var t;if(!n&&d.current){var c=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();c&&(d.current=!0,l((function(e){return[].concat(Object(y.a)(e),[c.x,c.y])})))}}),[n]),x=Object(a.useCallback)((function(){if(!n&&(d.current=!1,o&&b.length>=4)){var e=C(i),t=b.slice(0,2),c=b.slice(-2),a=k([t[0],t[1]],r),u=k([c[0],c[1]],r),s=z.apply(void 0,Object(y.a)(a)),j=e.nodes.find((function(e){return e.x===s.x&&e.y===s.y}));j?s.id=j.id:e.nodes.push(s);var f=z.apply(void 0,Object(y.a)(u)),O=e.nodes.find((function(e){return e.x===f.x&&e.y===f.y}));O?f.id=O.id:e.nodes.push(f);var x=function(e,t,n){return{id:Object(I.a)(),name:e,nodeI:t,nodeJ:n}}("Beam_".concat(e.beams.length+1),s.id,f.id);e.beams.push(x),o(e),l([])}}),[n,b,o,r,i]);return Object(a.useEffect)((function(){n&&l([])}),[n]),{points:b,onPointerDown:j,onPointerMove:O,onPointerUp:x}},R=function(e){var t=e.points;return Object(O.jsx)(S.d,{children:Object(O.jsx)(S.e,{points:t,strokeWidth:3,stroke:"blue"})})},P=["nodeI","nodeJ"],A=["beam","force"],X=Object(a.createContext)(void 0),T=function(e){var t=e.children,n=e.tool,c=void 0===n?"select":n,r=e.size,i=e.gridSize,o=void 0===i?25:i,u=e.snapSize,s=void 0===u?25:u,b=e.structure,l=e.setStructure,d=Object(a.useMemo)((function(){var e={};return b.nodes.forEach((function(t){e[t.id]=t})),e}),[b.nodes]),j=Object(a.useMemo)((function(){var e={};return b.beams.forEach((function(t){var n=t.nodeI,c=t.nodeJ,r=Object(p.a)(t,P),i=Object(h.a)(Object(h.a)({},r),{},{nodeI:d[n],nodeJ:d[c]});e[r.id]=i})),e}),[d,b.beams]),f=Object(a.useMemo)((function(){var e=b.forces,t={};if(e.length>0){var n=e.map((function(e){return e.force})).reduce((function(e,t){return e+t}))/e.length;e.forEach((function(e){var c=e.beam,r=e.force,i=Object(p.a)(e,A),o=r/n;t[i.id]=Object(h.a)(Object(h.a)({},i),{},{force:r,forceRatio:o,beam:j[c]})}))}return t}),[j,b]),x=Object(a.useCallback)((function(e){var t=C(b),n="Force_".concat(t.forces.length+1),c=function(e){return Object(h.a)(Object(h.a)({},e),{},{id:Object(I.a)()})}(Object(h.a)({name:n},e));t.forces.push(c),l&&l(t)}),[l,b]),v=Object(a.useCallback)((function(e){var t=b.forces.findIndex((function(t){return t.id===e}));if(t>=0){var n=C(b);n.forces.splice(t,1),l&&l(n)}}),[l,b]),g=Object(a.useCallback)((function(e){var t=b.beams.findIndex((function(t){return t.id===e}));if(t>=0){var n=b.beams[t],c=n.nodeI,r=n.nodeJ,i=C(b);i.beams.splice(t,1),[c,r].forEach((function(e){var t=i.beams.some((function(t){var n=t.nodeI,c=t.nodeJ;return e===n||e===c}));if(!t){var n=i.nodes.findIndex((function(t){return t.id===e}));n>=0&&i.nodes.splice(n,1)}}));var o=i.forces.filter((function(t){return t.beam!==e}));i.forces=o;var a=i.trapezoids.filter((function(t){return t.beam!==e}));i.trapezoids=a,l&&l(i)}}),[l,b]);return Object(O.jsx)(X.Provider,{value:{tool:c,size:r,gridSize:o,snapSize:s,structure:b,nodes:d,beams:j,forces:f,addForce:x,deleteForce:v,deleteBeam:g,setStructure:l},children:t})},J={id:"",points:[],stroke:"#c9e1ff",strokeWidth:1,dash:[5,3],listening:!1},Y=function(){var e=Object(a.useContext)(X),t=e.size,n=e.gridSize,c=Object(a.useMemo)((function(){for(var e=[],c=1,r=0;r<=t.height;r+=n)e.push(Object(h.a)(Object(h.a)({},J),{},{id:"Horizontal_".concat(c),points:[0,r,t.width,r]})),c++;return e}),[n,t.height,t.width]),r=Object(a.useMemo)((function(){for(var e=[],c=1,r=0;r<=t.width;r+=n)e.push(Object(h.a)(Object(h.a)({},J),{},{id:"Vertical_".concat(c),points:[r,0,r,t.height]})),c++;return e}),[n,t.height,t.width]);return Object(O.jsxs)(S.d,{listening:!1,children:[c.map((function(e){return Object(O.jsx)(S.e,Object(h.a)({},e),e.id)})),r.map((function(e){return Object(O.jsx)(S.e,Object(h.a)({},e),e.id)}))]})},B=Object(a.createContext)(void 0),G=function(e){var t=e.children,n=Object(a.useState)([]),c=Object(f.a)(n,2),r=c[0],i=c[1],o=Object(a.useCallback)((function(e){return r.some((function(t){var n=t.type,c=t.id;return n===e.type&&c===e.id}))}),[r]),u=Object(a.useCallback)((function(e){o(e)||i((function(t){return[].concat(Object(y.a)(t),[e])}))}),[o]),s=Object(a.useCallback)((function(e){o(e)?i((function(t){return t.filter((function(t){var n=t.type,c=t.id;return!(n===e.type&&c===e.id)}))})):i((function(t){return[].concat(Object(y.a)(t),[e])}))}),[o]);return Object(O.jsx)(B.Provider,{value:{selected:r,setSelected:i,isSelected:o,select:u,toggle:s},children:t})},D=function(e){var t=e.name,n=e.nodeI,c=e.nodeJ,r=e.tool,i=e.selected,o=void 0!==i&&i,u=e.addForce,s=e.onDelete,b=e.onSelect,l=Object(a.useState)([]),d=Object(f.a)(l,2),j=d[0],x=d[1],v=Object(a.useState)([0,0]),h=Object(f.a)(v,2),g=h[0],m=h[1],p=Object(a.useState)(0),y=Object(f.a)(p,2),C=y[0],w=y[1],E=Object(a.useState)(0),k=Object(f.a)(E,2),I=k[0],z=k[1],M=Object(a.useState)([[0,0],[0,0]]),F=Object(f.a)(M,2),R=F[0],P=F[1],A=Object(a.useRef)(new N.a(0,0)),X=Object(a.useRef)(new N.a(0,0)),T=Object(a.useCallback)((function(e){if("force"===r){var t,n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();n&&(u(n,A.current,X.current),e.cancelBubble=!0)}else"delete"===r?(s(),e.cancelBubble=!0):"select"===r&&(b(),e.cancelBubble=!0)}),[u,s,b,r]);return Object(a.useEffect)((function(){if(x([n.x,n.y,c.x,c.y]),A.current.x=n.x,A.current.y=n.y,X.current.x=c.x,X.current.y=c.y,o){var e=A.current.distance(X.current),t=_(A.current,X.current),r=A.current.clone().add(t.clone().multiplyScalar(16)),i=X.current.clone().subtract(A.current).angleDeg(),a=t.clone().multiplyScalar(75),u=A.current.clone().add(a),s=X.current.clone().add(a);w(e),m([r.x,r.y]),z(i),P([[u.x,u.y],[s.x,s.y]])}}),[n.x,n.y,c.x,c.y,o]),Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(S.e,{points:j,stroke:o?"blue":"black",strokeWidth:4,onClick:T,onTap:T}),o&&Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(S.g,{x:g[0],y:g[1],rotation:I,text:t,fontSize:12,width:C,fill:"blue",align:"center",wrap:"none",ellipsis:!0,listening:!1}),Object(O.jsx)(V,{start:R[0],end:R[1]})]})]})},W=function(e){var t=Object(a.useContext)(X),n=t.tool,c=t.addForce,r=t.deleteBeam,i=Object(a.useContext)(B),o=i.selected,u=i.toggle,s=Object(a.useCallback)((function(t,n,r){var i=new N.a(t.x,t.y),o=function(e,t,n,c){var r=t.distance(n),i=t.distance(c);return{beam:e,force:10,distanceI:w(i/r)}}(e.id,n,r,i);c(o)}),[c,e.id]),b=Object(a.useCallback)((function(){r(e.id)}),[r,e.id]),l=Object(a.useCallback)((function(){u({type:"beams",id:e.id})}),[e.id,u]),d=Object(a.useMemo)((function(){return o.some((function(t){return"beams"===t.type&&t.id===e.id}))}),[e.id,o]);return Object(O.jsx)(D,Object(h.a)(Object(h.a)({},e),{},{tool:n,selected:d,addForce:s,onDelete:b,onSelect:l}))},L=function(e){var t=e.id,n=e.beam,c=e.distanceI,r=e.forceRatio,i=Object(a.useContext)(X),o=i.deleteForce,u=i.tool,s=Object(a.useMemo)((function(){var e=n.nodeI,t=n.nodeJ,i=new N.a(e.x,e.y),o=new N.a(t.x,t.y),a=function(e,t,n){var c=t.clone().subtract(e).normalize(),r=e.distance(t),i=c.multiplyScalar(r*n);return e.clone().add(i)}(i,o,c),u=_(i,o),s=a.clone().add(u.multiplyScalar(30*r));return[s.x,s.y,a.x,a.y]}),[n,c,r]),b=Object(a.useCallback)((function(e){"delete"===u&&(o(t),e.cancelBubble=!0)}),[o,t,u]);return Object(O.jsx)(S.a,{points:s,pointerLength:6,pointerWidth:6,fill:"orange",stroke:"orange",strokeWidth:2,onClick:b,onTap:b})},H={fill:"silver",stroke:"silver",strokeWidth:1,listening:!1},U=Object(h.a)({pointerLength:6,pointerWidth:6,pointerAtBeginning:!0},H),V=function(e){var t=e.start,n=e.end,c=Object(a.useRef)(new N.a(0,0)),r=Object(a.useRef)(new N.a(0,0)),i=Object(a.useState)(0),o=Object(f.a)(i,2),u=o[0],s=o[1],b=Object(a.useState)(0),l=Object(f.a)(b,2),d=l[0],j=l[1],x=Object(a.useState)([0,0]),v=Object(f.a)(x,2),g=v[0],m=v[1];return Object(a.useEffect)((function(){c.current.x=t[0],c.current.y=t[1],r.current.x=n[0],r.current.y=n[1];var e=c.current.distance(r.current),i=r.current.clone().subtract(c.current).normalize().angleDeg();s(Math.round(e)),j(90===i?-90:i),m(90===i?n:t)}),[n,t]),Object(O.jsxs)(S.c,{x:g[0],y:g[1],rotation:d,children:[Object(O.jsx)(S.e,Object(h.a)({points:[0,0,0,10]},H)),Object(O.jsx)(S.a,Object(h.a)({points:[0,5,u,5]},U)),Object(O.jsx)(S.e,Object(h.a)({points:[u,0,u,10]},H)),Object(O.jsx)(S.g,{x:0,y:-8,text:"".concat(u,"px"),fontSize:12,fill:"silver",width:u,align:"center",listening:!1,wrap:"none",ellipsis:!0})]})},q=function(e){var t=e.id,n=e.x,c=e.y,r=e.draggable,i=void 0!==r&&r,o=e.onChange,u=e.onCommit,s=Object(a.useState)(!1),b=Object(f.a)(s,2),l=b[0],d=b[1],j=Object(a.useRef)({x:n,y:c}),x=Object(a.useRef)(),v=Object(a.useCallback)((function(){if(i){var e={id:t,x:j.current.x,y:j.current.y};o&&o(e)}}),[i,t,o]),h=Object(a.useCallback)((function(e){var t,n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();n&&(j.current=n,d(!0))}),[]),g=Object(a.useCallback)((function(e){var t,n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();n&&(j.current=n)}),[]),m=Object(a.useCallback)((function(e){var n,c=null===(n=e.target.getStage())||void 0===n?void 0:n.getPointerPosition();if(c){j.current=c,d(!1),x.current&&(clearInterval(x.current),x.current=void 0);var r={id:t,x:j.current.x,y:j.current.y};u&&u(r)}}),[t,u]);return Object(a.useEffect)((function(){var e=x.current;return i&&l&&(v(),x.current=setInterval(v,100)),function(){e&&clearInterval(e)}}),[i,l,v]),Object(O.jsx)(S.b,{id:t,x:n,y:c,fill:l?"blue":"black",radius:4,draggable:i,onDragStart:h,onDragMove:g,onDragEnd:m,_useStrictMode:!0})},K=function(e){var t=Object(a.useContext)(X),n=t.tool,c=t.snapSize,r=t.setStructure,i=Object(a.useMemo)((function(){return"pen"!==n&&Boolean(r)}),[r,n]),o=Object(a.useCallback)((function(e){var t=e.id,n=e.x,i=e.y;if(r){var o=k([n,i],c),a=Object(f.a)(o,2),u=a[0],s=a[1];r((function(e){var n=C(e),c=n.nodes.find((function(e){return e.id===t}));return c&&(c.x=u,c.y=s),n}))}}),[r,c]),u=Object(a.useCallback)((function(e){var t=e.id,n=e.x,i=e.y;if(r){var o=k([n,i],c),a=Object(f.a)(o,2),u=a[0],s=a[1];r((function(e){var n,c,r,i=C(e),o=i.nodes.findIndex((function(e){return e.id===t}));if(o>=0){var a=i.nodes.find((function(e){return e.id!==t&&e.x===u&&e.y===s}));a&&(n=i,c=t,r=a.id,n.beams.forEach((function(e){e.nodeI===c&&(e.nodeI=r),e.nodeJ===c&&(e.nodeJ=r)})),i.nodes.splice(o,1))}return i}))}}),[r,c]);return Object(O.jsx)(q,Object(h.a)(Object(h.a)({},e),{},{draggable:i,onChange:o,onCommit:u}))},Q=25,Z=function(){var e=Object(a.useContext)(X).nodes,t=Object(a.useMemo)((function(){var t={maxX:Number.MIN_SAFE_INTEGER,minX:Number.MAX_SAFE_INTEGER,guidesX:[],maxY:Number.MIN_SAFE_INTEGER,minY:Number.MAX_SAFE_INTEGER,guidesY:[]},n=new Set,c=new Set;if(Object.values(e).forEach((function(e){var r=e.x,i=e.y;t.maxX<r&&(t.maxX=r),t.minX>r&&(t.minX=r),n.has(r)||n.add(r),t.maxY<i&&(t.maxY=i),t.minY>i&&(t.minY=i),c.has(i)||c.add(i)})),n.size>1)for(var r=Array.from(n).sort((function(e,t){return e<t?-1:1})),i=r[0],o=1;o<r.length;o++){var a=r[o],u={key:"LocalGuideX_".concat(o),start:[i,t.maxY+100],end:[a,t.maxY+100]};i=a,t.guidesX.push(u)}if(c.size>1)for(var s=Array.from(c).sort((function(e,t){return e<t?-1:1})),b=s[0],l=Math.max(t.minX-100,50),d=1;d<s.length;d++){var j=s[d],f={key:"LocalGuideY_".concat(d),start:[l,b],end:[l,j]};b=j,t.guidesY.push(f)}return t}),[e]),n=t.minX,c=t.maxX,r=t.guidesX,i=t.minY,o=t.maxY,u=t.guidesY,s=Object(a.useMemo)((function(){return n!==Number.MAX_SAFE_INTEGER?Math.max(Q,n-125):0}),[n]),b=Object(a.useMemo)((function(){return o!==Number.MIN_SAFE_INTEGER?o+125:0}),[o]);return Object(O.jsxs)(S.d,{listening:!1,children:[n!==Number.MAX_SAFE_INTEGER&&c!==Number.MIN_SAFE_INTEGER&&Object(O.jsx)(V,{start:[n,b],end:[c,b]}),r.map((function(e){return Object(O.jsx)(V,Object(h.a)({},e))})),i!==Number.MAX_SAFE_INTEGER&&o!==Number.MIN_SAFE_INTEGER&&Object(O.jsx)(V,{start:[s,i],end:[s,o]}),u.map((function(e){return Object(O.jsx)(V,Object(h.a)({},e))}))]})},$=function(){var e=Object(a.useContext)(X),t=e.nodes,n=e.beams,c=e.forces;return Object(O.jsxs)(S.d,{children:[Object.entries(n).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1];return Object(O.jsx)(W,Object(h.a)({},c),n)})),Object.entries(t).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1];return Object(O.jsx)(K,Object(h.a)({},c),n)})),Object.entries(c).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1];return Object(O.jsx)(L,Object(h.a)({},c),n)}))]})},ee=["points"],te=function(e){var t=e.tool,n=e.structure,c=e.size,r=e.readonly,i=void 0!==r&&r,o=e.setStructure,a=F({disabled:i||"pen"!==t,structure:n,setStructure:o}),u=a.points,s=Object(p.a)(a,ee);return Object(O.jsx)(S.f,Object(h.a)(Object(h.a)({width:c.width,height:c.height},s),{},{children:Object(O.jsx)(T,{size:c,structure:n,tool:t,setStructure:o,children:Object(O.jsxs)(G,{children:[Object(O.jsx)(Y,{}),Object(O.jsx)(Z,{}),Object(O.jsx)($,{}),Object(O.jsx)(R,{points:u})]})})}))},ne=["tool"],ce=function(e){var t=e.tool,n=void 0===t?"select":t,c=Object(p.a)(e,ne),r=Object(a.useState)({width:0,height:0}),i=Object(f.a)(r,2),o=i[0],u=i[1],s=Object(a.useRef)(null);return Object(a.useEffect)((function(){var e=new ResizeObserver((function(e){var t=e[0].contentRect,n=t.width,c=t.height;u({width:n,height:c})}));return s.current&&e.observe(s.current),function(){e.disconnect()}}),[]),Object(O.jsx)(g.a,{ref:s,sx:{width:"auto",height:"100%",backgroundColor:"#ffffff",overscrollBehavior:"contain"},children:Object(O.jsx)(te,Object(h.a)({size:o,tool:n},c))})},re=function(){var e=Object(a.useContext)(x).tool,t=Object(a.useState)(m),n=Object(f.a)(t,2),c=n[0],r=n[1];return Object(O.jsx)(g.a,{sx:{boxSizing:"border-box",ml:1,mb:1,flex:1,border:function(e){return"1px solid ".concat(e.palette.divider)},borderRadius:1,overflow:"hidden"},children:Object(O.jsx)(ce,{tool:e,structure:c,setStructure:r})})},ie=n(107),oe=n(113),ae=n(112),ue=null!==(c=null===(r="b0545bdf47dce03f3d44e0672848b52a9a53bef5\n")?void 0:r.substring(0,7))&&void 0!==c?c:"",se=null!==(i="2021/12/21 14:08:06")?i:"",be=null!==(o="0.1.0")?o:"",le=function(){return Object(O.jsx)(ae.a,{variant:"caption",sx:{ml:2},children:"ver ".concat(be," (").concat(ue,": ").concat(se,")")})},de=function(){return Object(O.jsx)(ie.a,{position:"static",children:Object(O.jsxs)(oe.a,{variant:"dense",children:[Object(O.jsx)(ae.a,{component:"h1",variant:"h6",color:"inherit",children:"Drawing Sample"}),Object(O.jsx)(le,{})]})})},je=n(98),fe=n(99),Oe=n(100),xe=n(101),ve=n(102),he=n(103),ge=n(109),me=n(105),pe=["select","pen","force","trapezoid","delete"],Se={select:{tool:"select",icon:Object(O.jsx)(je.a,{}),label:"\u9078\u629e"},pen:{tool:"pen",icon:Object(O.jsx)(fe.a,{}),label:"\u6881\u8981\u7d20\u306e\u63cf\u753b"},force:{tool:"force",icon:Object(O.jsx)(Oe.a,{}),label:"\u96c6\u4e2d\u8377\u91cd\u306e\u8ffd\u52a0"},trapezoid:{tool:"trapezoid",icon:Object(O.jsx)(xe.a,{}),label:"\u5206\u5e03\u8377\u91cd\u306e\u8ffd\u52a0"},delete:{tool:"delete",icon:Object(O.jsx)(ve.a,{}),label:"\u8981\u7d20\u306e\u524a\u9664"}},ye=function(e){var t=e.tool,n=e.onChange,c=Object(a.useCallback)((function(e,t){var c;null!==t&&("string"===typeof(c=t)&&pe.some((function(e){return e===c})))&&n(t)}),[n]);return Object(O.jsxs)(he.a,{sx:{width:160},alignItems:"flex-start",children:[Object(O.jsx)(ae.a,{variant:"caption",children:"Toolbox"}),Object(O.jsx)(ge.a,{orientation:"vertical",value:t,exclusive:!0,fullWidth:!0,onChange:c,children:Object.entries(Se).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1],r=c.icon,i=c.label;return Object(O.jsxs)(me.a,{value:n,sx:{justifyContent:"flex-start",alignItems:"center"},children:[r,Object(O.jsx)(ae.a,{variant:"caption",sx:{ml:1},children:i})]},n)}))})]})},Ce=function(){var e=Object(a.useContext)(x),t=e.tool,n=e.setTool;return Object(O.jsx)(ye,{tool:t,onChange:n})},we=function(){var e=Object(a.useState)({width:0,height:0}),t=Object(f.a)(e,2),n=t[0],c=t[1],r=Object(a.useCallback)((function(){var e=window,t=e.innerHeight,n=e.innerWidth;c({height:t,width:n})}),[]);return Object(a.useEffect)((function(){return r(),window.addEventListener("resize",r),function(){window.removeEventListener("resize",r)}}),[r]),Object(O.jsxs)(g.a,{sx:Object(h.a)(Object(h.a)({},n),{},{overflow:"hidden"}),children:[Object(O.jsx)(de,{}),Object(O.jsxs)(g.a,{sx:{boxSizing:"border-box",width:"auto",height:"calc(100% - 48px)",display:"flex",flexDirection:"row",flexWrap:"nowrap",alignItems:"stretch",pt:1,px:1},children:[Object(O.jsx)(Ce,{}),Object(O.jsx)(re,{})]})]})},Ee=Object(l.a)(),ke=function(){return Object(O.jsx)(d.a,{theme:Ee,children:Object(O.jsxs)(v,{children:[Object(O.jsx)(j.a,{}),Object(O.jsx)(we,{})]})})},Ie=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,115)).then((function(t){var n=t.getCLS,c=t.getFID,r=t.getFCP,i=t.getLCP,o=t.getTTFB;n(e),c(e),r(e),i(e),o(e)}))};b.a.render(Object(O.jsx)(u.a.StrictMode,{children:Object(O.jsx)(ke,{})}),document.getElementById("root")),Ie()}},[[76,1,2]]]);
//# sourceMappingURL=main.efb4be5d.chunk.js.map