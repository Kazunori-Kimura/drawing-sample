(this["webpackJsonpdrawing-sample"]=this["webpackJsonpdrawing-sample"]||[]).push([[0],{76:function(e,t,n){"use strict";n.r(t);var c,r,i,a,o=n(0),u=n.n(o),s=n(54),l=n.n(s),b=n(57),d=n(110),j=n(114),f=n(6),O=n(1),x=Object(o.createContext)(void 0),v=function(e){var t=e.children,n=Object(o.useState)("select"),c=Object(f.a)(n,2),r=c[0],i=c[1];return Object(O.jsx)(x.Provider,{value:{tool:r,setTool:i},children:t})},h=n(7),g=n(111),m={unit:{force:"kN",length:"m"},nodes:[],beams:[],forces:[],trapezoids:[]},p=n(26),S=n(10),y=n(15),C=function(e){return JSON.parse(JSON.stringify(e))},w=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:3,n=Math.pow(10,t),c=Math.round(e*n)/n;return c},k=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:25,n=e/t,c=Math.round(n)*t;return c},E=function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1],r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:25;return[k(n,r),k(c,r)]},I=n(106),z=function(e,t){return{id:Object(I.a)(),x:e,y:t}},M=n(37),N=n.n(M),_=new N.a(1,0),R=new N.a(0,1),F=function(e,t){var n=t.clone().subtract(e).normalize(),c=new N.a(n.y,-1*n.x).normalize();return R.dot(c)>0&&c.invert(),c},P=function(e){var t=e.disabled,n=void 0!==t&&t,c=e.snapSize,r=void 0===c?25:c,i=e.structure,a=e.setStructure,u=Object(o.useState)([]),s=Object(f.a)(u,2),l=s[0],b=s[1],d=Object(o.useRef)(!1),j=Object(o.useCallback)((function(e){var t;if(!n){var c=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();c&&(d.current=!0,b([c.x,c.y]))}}),[n]),O=Object(o.useCallback)((function(e){var t;if(!n&&d.current){var c=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();c&&(d.current=!0,b((function(e){return[].concat(Object(y.a)(e),[c.x,c.y])})))}}),[n]),x=Object(o.useCallback)((function(){if(!n&&(d.current=!1,a&&l.length>=4)){var e=C(i),t=l.slice(0,2),c=l.slice(-2),o=E([t[0],t[1]],r),u=E([c[0],c[1]],r),s=z.apply(void 0,Object(y.a)(o)),j=e.nodes.find((function(e){return e.x===s.x&&e.y===s.y}));j?s.id=j.id:e.nodes.push(s);var f=z.apply(void 0,Object(y.a)(u)),O=e.nodes.find((function(e){return e.x===f.x&&e.y===f.y}));O?f.id=O.id:e.nodes.push(f);var x=function(e,t,n){return{id:Object(I.a)(),name:e,nodeI:t,nodeJ:n}}("Beam_".concat(e.beams.length+1),s.id,f.id);e.beams.push(x),a(e),b([])}}),[n,l,a,r,i]);return Object(o.useEffect)((function(){n&&b([])}),[n]),{points:l,onPointerDown:j,onPointerMove:O,onPointerUp:x}},X=function(e){var t=e.points;return Object(O.jsx)(S.d,{children:Object(O.jsx)(S.e,{points:t,strokeWidth:3,stroke:"blue"})})},A=["nodeI","nodeJ"],T=["beam","force"],D=Object(o.createContext)(void 0),J=function(e){var t=e.children,n=e.tool,c=void 0===n?"select":n,r=e.size,i=e.gridSize,a=void 0===i?25:i,u=e.snapSize,s=void 0===u?25:u,l=e.structure,b=e.setStructure,d=Object(o.useMemo)((function(){var e={};return l.nodes.forEach((function(t){e[t.id]=t})),e}),[l.nodes]),j=Object(o.useMemo)((function(){var e={};return l.beams.forEach((function(t){var n=t.nodeI,c=t.nodeJ,r=Object(p.a)(t,A),i=Object(h.a)(Object(h.a)({},r),{},{nodeI:d[n],nodeJ:d[c]});e[r.id]=i})),e}),[d,l.beams]),f=Object(o.useMemo)((function(){var e=l.forces,t={};if(e.length>0){var n=e.map((function(e){return e.force})).reduce((function(e,t){return e+t}))/e.length;e.forEach((function(e){var c=e.beam,r=e.force,i=Object(p.a)(e,T),a=r/n;t[i.id]=Object(h.a)(Object(h.a)({},i),{},{force:r,forceRatio:a,beam:j[c]})}))}return t}),[j,l]),x=Object(o.useCallback)((function(e){var t=C(l),n="Force_".concat(t.forces.length+1),c=function(e){return Object(h.a)(Object(h.a)({},e),{},{id:Object(I.a)()})}(Object(h.a)({name:n},e));t.forces.push(c),b&&b(t)}),[b,l]),v=Object(o.useCallback)((function(e){var t=l.forces.findIndex((function(t){return t.id===e}));if(t>=0){var n=C(l);n.forces.splice(t,1),b&&b(n)}}),[b,l]),g=Object(o.useCallback)((function(e){var t=l.beams.findIndex((function(t){return t.id===e}));if(t>=0){var n=l.beams[t],c=n.nodeI,r=n.nodeJ,i=C(l);i.beams.splice(t,1),[c,r].forEach((function(e){var t=i.beams.some((function(t){var n=t.nodeI,c=t.nodeJ;return e===n||e===c}));if(!t){var n=i.nodes.findIndex((function(t){return t.id===e}));n>=0&&i.nodes.splice(n,1)}}));var a=i.forces.filter((function(t){return t.beam!==e}));i.forces=a;var o=i.trapezoids.filter((function(t){return t.beam!==e}));i.trapezoids=o,b&&b(i)}}),[b,l]);return Object(O.jsx)(D.Provider,{value:{tool:c,size:r,gridSize:a,snapSize:s,structure:l,nodes:d,beams:j,forces:f,addForce:x,deleteForce:v,deleteBeam:g,setStructure:b},children:t})},Y={id:"",points:[],stroke:"#c9e1ff",strokeWidth:1,dash:[5,3],listening:!1},B=function(){var e=Object(o.useContext)(D),t=e.size,n=e.gridSize,c=Object(o.useMemo)((function(){for(var e=[],c=1,r=0;r<=t.height;r+=n)e.push(Object(h.a)(Object(h.a)({},Y),{},{id:"Horizontal_".concat(c),points:[0,r,t.width,r]})),c++;return e}),[n,t.height,t.width]),r=Object(o.useMemo)((function(){for(var e=[],c=1,r=0;r<=t.width;r+=n)e.push(Object(h.a)(Object(h.a)({},Y),{},{id:"Vertical_".concat(c),points:[r,0,r,t.height]})),c++;return e}),[n,t.height,t.width]);return Object(O.jsxs)(S.d,{listening:!1,children:[c.map((function(e){return Object(O.jsx)(S.e,Object(h.a)({},e),e.id)})),r.map((function(e){return Object(O.jsx)(S.e,Object(h.a)({},e),e.id)}))]})},G=Object(o.createContext)(void 0),W=function(e){var t=e.value,n=t.selected,c=t.setSelected,r=e.children,i=Object(o.useCallback)((function(e){return n.some((function(t){var n=t.type,c=t.id;return n===e.type&&c===e.id}))}),[n]),a=Object(o.useCallback)((function(e){i(e)||c((function(t){return[].concat(Object(y.a)(t),[e])}))}),[i,c]),u=Object(o.useCallback)((function(e){i(e)?c((function(t){return t.filter((function(t){var n=t.type,c=t.id;return!(n===e.type&&c===e.id)}))})):c((function(t){return[].concat(Object(y.a)(t),[e])}))}),[i,c]);return Object(O.jsx)(G.Provider,{value:{selected:n,setSelected:c,isSelected:i,select:a,toggle:u},children:r})},L=function(e){var t=e.name,n=e.nodeI,c=e.nodeJ,r=e.tool,i=e.selected,a=void 0!==i&&i,u=e.addForce,s=e.onDelete,l=e.onSelect,b=Object(o.useState)([]),d=Object(f.a)(b,2),j=d[0],x=d[1],v=Object(o.useState)([0,0]),h=Object(f.a)(v,2),g=h[0],m=h[1],p=Object(o.useState)(0),y=Object(f.a)(p,2),C=y[0],w=y[1],k=Object(o.useState)(0),E=Object(f.a)(k,2),I=E[0],z=E[1],M=Object(o.useState)([[0,0],[0,0]]),_=Object(f.a)(M,2),R=_[0],P=_[1],X=Object(o.useRef)(new N.a(0,0)),A=Object(o.useRef)(new N.a(0,0)),T=Object(o.useCallback)((function(e){if("force"===r){var t,n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();n&&(u(n,X.current,A.current),e.cancelBubble=!0)}else"delete"===r?(s(),e.cancelBubble=!0):"select"===r&&(l(),e.cancelBubble=!0)}),[u,s,l,r]);return Object(o.useEffect)((function(){if(x([n.x,n.y,c.x,c.y]),X.current.x=n.x,X.current.y=n.y,A.current.x=c.x,A.current.y=c.y,a){var e=X.current,t=A.current;if(e.x>t.x){var r=[t,e];e=r[0],t=r[1]}var i=e.distance(t),o=F(e,t),u=e.clone().add(o.clone().multiplyScalar(16)),s=t.clone().subtract(e).angleDeg(),l=o.clone().multiplyScalar(75),b=e.clone().add(l),d=t.clone().add(l);w(i),m([u.x,u.y]),z(s),P([[b.x,b.y],[d.x,d.y]])}}),[n.x,n.y,c.x,c.y,a]),Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(S.e,{points:j,stroke:a?"blue":"black",strokeWidth:4,onClick:T,onTap:T}),a&&Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(S.g,{x:g[0],y:g[1],rotation:I,text:t,fontSize:12,width:C,fill:"blue",align:"center",wrap:"none",ellipsis:!0,listening:!1}),Object(O.jsx)(Q,{start:R[0],end:R[1]})]})]})},H=function(e){var t=Object(o.useContext)(D),n=t.tool,c=t.addForce,r=t.deleteBeam,i=Object(o.useContext)(G),a=i.isSelected,u=i.toggle,s=Object(o.useCallback)((function(t,n,r){var i=new N.a(t.x,t.y),a=function(e,t,n,c){var r=t.distance(n),i=t.distance(c);return{beam:e,force:10,distanceI:w(i/r)}}(e.id,n,r,i);c(a)}),[c,e.id]),l=Object(o.useCallback)((function(){r(e.id)}),[r,e.id]),b=Object(o.useCallback)((function(){u({type:"beams",id:e.id})}),[e.id,u]);return Object(O.jsx)(L,Object(h.a)(Object(h.a)({},e),{},{tool:n,selected:a({type:"beams",id:e.id}),addForce:s,onDelete:l,onSelect:b}))},U=function(e){var t=e.beam,n=e.distanceI,c=e.force,r=e.forceRatio,i=e.tool,a=e.selected,u=void 0!==a&&a,s=e.onDelete,l=e.onSelect,b=Object(o.useState)([]),d=Object(f.a)(b,2),j=d[0],x=d[1],v=Object(o.useState)(0),h=Object(f.a)(v,2),g=h[0],m=h[1],p=Object(o.useState)(0),y=Object(f.a)(p,2),C=y[0],w=y[1],k=Object(o.useState)([0,0]),E=Object(f.a)(k,2),I=E[0],z=E[1],M=Object(o.useRef)(new N.a(0,0)),R=Object(o.useRef)(new N.a(0,0));Object(o.useEffect)((function(){var e=t.nodeI,c=t.nodeJ;M.current.x=e.x,M.current.y=e.y,R.current.x=c.x,R.current.y=c.y;var i=function(e,t,n){if(n>=1)return t;if(n<=0)return e;var c=t.clone().subtract(e).normalize(),r=e.distance(t),i=c.multiplyScalar(r*n);return e.clone().add(i)}(M.current,R.current,n),a=F(M.current,R.current),o=30*r,u=i.clone().add(a.multiplyScalar(o));x([u.x,u.y,i.x,i.y]),m(Math.max(o,140));var s=a.clone().angleDeg();w(s);var l=M.current.clone().subtract(R.current).normalize();_.dot(l)<0&&l.invert();var b=i.clone().add(l.multiplyScalar(6));z([b.x,b.y])}),[t,n,r]);var P=Object(o.useCallback)((function(e){"delete"===i?(s(),e.cancelBubble=!0):"select"===i&&(l(),e.cancelBubble=!0)}),[s,l,i]),X=Object(o.useMemo)((function(){return u?"red":"orange"}),[u]);return Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(S.a,{points:j,pointerLength:6,pointerWidth:6,fill:X,stroke:X,strokeWidth:2,onClick:P,onTap:P}),u&&Object(O.jsx)(S.g,{x:I[0],y:I[1],offsetX:-6,text:"".concat(c,"kN"),fontSize:12,width:g,rotation:C,fill:X,listening:!1,wrap:"none",ellipsis:!0})]})},V=function(e){var t=Object(o.useContext)(D),n=t.tool,c=t.deleteForce,r=Object(o.useContext)(G),i=r.isSelected,a=r.toggle,u=Object(o.useCallback)((function(){c(e.id)}),[c,e.id]),s=Object(o.useCallback)((function(){a({type:"forces",id:e.id})}),[e.id,a]);return Object(O.jsx)(U,Object(h.a)(Object(h.a)({},e),{},{tool:n,selected:i({type:"forces",id:e.id}),onDelete:u,onSelect:s}))},q={fill:"silver",stroke:"silver",strokeWidth:1,listening:!1},K=Object(h.a)({pointerLength:6,pointerWidth:6,pointerAtBeginning:!0},q),Q=function(e){var t=e.start,n=e.end,c=Object(o.useRef)(new N.a(0,0)),r=Object(o.useRef)(new N.a(0,0)),i=Object(o.useState)(0),a=Object(f.a)(i,2),u=a[0],s=a[1],l=Object(o.useState)(0),b=Object(f.a)(l,2),d=b[0],j=b[1],x=Object(o.useState)([0,0]),v=Object(f.a)(x,2),g=v[0],m=v[1];return Object(o.useEffect)((function(){c.current.x=t[0],c.current.y=t[1],r.current.x=n[0],r.current.y=n[1];var e=c.current.distance(r.current),i=r.current.clone().subtract(c.current).normalize().angleDeg();s(Math.round(e)),j(90===i?-90:i),m(90===i?n:t)}),[n,t]),Object(O.jsxs)(S.c,{x:g[0],y:g[1],rotation:d,children:[Object(O.jsx)(S.e,Object(h.a)({points:[0,0,0,10]},q)),Object(O.jsx)(S.a,Object(h.a)({points:[0,5,u,5]},K)),Object(O.jsx)(S.e,Object(h.a)({points:[u,0,u,10]},q)),Object(O.jsx)(S.g,{x:0,y:-8,text:"".concat(u,"px"),fontSize:12,fill:"silver",width:u,align:"center",listening:!1,wrap:"none",ellipsis:!0})]})},Z=function(e){var t=e.id,n=e.x,c=e.y,r=e.draggable,i=void 0!==r&&r,a=e.onChange,u=e.onCommit,s=Object(o.useState)(!1),l=Object(f.a)(s,2),b=l[0],d=l[1],j=Object(o.useRef)({x:n,y:c}),x=Object(o.useRef)(),v=Object(o.useCallback)((function(){if(i){var e={id:t,x:j.current.x,y:j.current.y};a&&a(e)}}),[i,t,a]),h=Object(o.useCallback)((function(e){var t,n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();n&&(j.current=n,d(!0))}),[]),g=Object(o.useCallback)((function(e){var t,n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();n&&(j.current=n)}),[]),m=Object(o.useCallback)((function(e){var n,c=null===(n=e.target.getStage())||void 0===n?void 0:n.getPointerPosition();if(c){j.current=c,d(!1),x.current&&(clearInterval(x.current),x.current=void 0);var r={id:t,x:j.current.x,y:j.current.y};u&&u(r)}}),[t,u]);return Object(o.useEffect)((function(){var e=x.current;return i&&b&&(v(),x.current=setInterval(v,100)),function(){e&&clearInterval(e)}}),[i,b,v]),Object(O.jsx)(S.b,{id:t,x:n,y:c,fill:b?"blue":"black",radius:4,draggable:i,onDragStart:h,onDragMove:g,onDragEnd:m,_useStrictMode:!0})},$=function(e){var t=Object(o.useContext)(D),n=t.tool,c=t.snapSize,r=t.setStructure,i=Object(o.useMemo)((function(){return"pen"!==n&&Boolean(r)}),[r,n]),a=Object(o.useCallback)((function(e){var t=e.id,n=e.x,i=e.y;if(r){var a=E([n,i],c),o=Object(f.a)(a,2),u=o[0],s=o[1];r((function(e){var n=C(e),c=n.nodes.find((function(e){return e.id===t}));return c&&(c.x=u,c.y=s),n}))}}),[r,c]),u=Object(o.useCallback)((function(e){var t=e.id,n=e.x,i=e.y;if(r){var a=E([n,i],c),o=Object(f.a)(a,2),u=o[0],s=o[1];r((function(e){var n,c,r,i=C(e),a=i.nodes.findIndex((function(e){return e.id===t}));if(a>=0){var o=i.nodes.find((function(e){return e.id!==t&&e.x===u&&e.y===s}));o&&(n=i,c=t,r=o.id,n.beams.forEach((function(e){e.nodeI===c&&(e.nodeI=r),e.nodeJ===c&&(e.nodeJ=r)})),i.nodes.splice(a,1))}return i}))}}),[r,c]);return Object(O.jsx)(Z,Object(h.a)(Object(h.a)({},e),{},{draggable:i,onChange:a,onCommit:u}))},ee=25,te=function(){var e=Object(o.useContext)(D).nodes,t=Object(o.useMemo)((function(){var t={maxX:Number.MIN_SAFE_INTEGER,minX:Number.MAX_SAFE_INTEGER,guidesX:[],maxY:Number.MIN_SAFE_INTEGER,minY:Number.MAX_SAFE_INTEGER,guidesY:[]},n=new Set,c=new Set;if(Object.values(e).forEach((function(e){var r=e.x,i=e.y;t.maxX<r&&(t.maxX=r),t.minX>r&&(t.minX=r),n.has(r)||n.add(r),t.maxY<i&&(t.maxY=i),t.minY>i&&(t.minY=i),c.has(i)||c.add(i)})),n.size>1)for(var r=Array.from(n).sort((function(e,t){return e<t?-1:1})),i=r[0],a=1;a<r.length;a++){var o=r[a],u={key:"LocalGuideX_".concat(a),start:[i,t.maxY+100],end:[o,t.maxY+100]};i=o,t.guidesX.push(u)}if(c.size>1)for(var s=Array.from(c).sort((function(e,t){return e<t?-1:1})),l=s[0],b=Math.max(t.minX-100,50),d=1;d<s.length;d++){var j=s[d],f={key:"LocalGuideY_".concat(d),start:[b,l],end:[b,j]};l=j,t.guidesY.push(f)}return t}),[e]),n=t.minX,c=t.maxX,r=t.guidesX,i=t.minY,a=t.maxY,u=t.guidesY,s=Object(o.useMemo)((function(){return n!==Number.MAX_SAFE_INTEGER?Math.max(ee,n-125):0}),[n]),l=Object(o.useMemo)((function(){return a!==Number.MIN_SAFE_INTEGER?a+125:0}),[a]);return Object(O.jsxs)(S.d,{listening:!1,children:[n!==Number.MAX_SAFE_INTEGER&&c!==Number.MIN_SAFE_INTEGER&&Object(O.jsx)(Q,{start:[n,l],end:[c,l]}),r.map((function(e){return Object(O.jsx)(Q,Object(h.a)({},e))})),i!==Number.MAX_SAFE_INTEGER&&a!==Number.MIN_SAFE_INTEGER&&Object(O.jsx)(Q,{start:[s,i],end:[s,a]}),u.map((function(e){return Object(O.jsx)(Q,Object(h.a)({},e))}))]})},ne=function(){var e=Object(o.useContext)(D),t=e.nodes,n=e.beams,c=e.forces;return Object(O.jsxs)(S.d,{children:[Object.entries(n).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1];return Object(O.jsx)(H,Object(h.a)({},c),n)})),Object.entries(t).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1];return Object(O.jsx)($,Object(h.a)({},c),n)})),Object.entries(c).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1];return Object(O.jsx)(V,Object(h.a)({},c),n)}))]})},ce=["points"],re=function(e){var t=e.tool,n=e.structure,c=e.size,r=e.readonly,i=void 0!==r&&r,a=e.setStructure,u=Object(o.useContext)(G),s=u.selected,l=u.setSelected,b=P({disabled:i||"pen"!==t,structure:n,setStructure:a}),d=b.points,j=Object(p.a)(b,ce),f=Object(o.useCallback)((function(e){"select"===t&&l([])}),[l,t]);return Object(O.jsx)(S.f,Object(h.a)(Object(h.a)({width:c.width,height:c.height},j),{},{onClick:f,onTap:f,children:Object(O.jsx)(J,{size:c,structure:n,tool:t,setStructure:a,children:Object(O.jsxs)(W,{value:{selected:s,setSelected:l},children:[Object(O.jsx)(B,{}),Object(O.jsx)(te,{}),Object(O.jsx)(ne,{}),Object(O.jsx)(X,{points:d})]})})}))},ie=["tool"],ae=function(e){var t=e.tool,n=void 0===t?"select":t,c=Object(p.a)(e,ie),r=Object(o.useState)({width:0,height:0}),i=Object(f.a)(r,2),a=i[0],u=i[1],s=Object(o.useState)([]),l=Object(f.a)(s,2),b=l[0],d=l[1],j=Object(o.useRef)(null);return Object(o.useEffect)((function(){var e=new ResizeObserver((function(e){var t=e[0].contentRect,n=t.width,c=t.height;u({width:n,height:c})}));return j.current&&e.observe(j.current),function(){e.disconnect()}}),[]),Object(O.jsx)(g.a,{ref:j,sx:{width:"auto",height:"100%",backgroundColor:"#ffffff",overscrollBehavior:"contain"},children:Object(O.jsx)(W,{value:{selected:b,setSelected:d},children:Object(O.jsx)(re,Object(h.a)({size:a,tool:n},c))})})},oe=function(){var e=Object(o.useContext)(x).tool,t=Object(o.useState)(m),n=Object(f.a)(t,2),c=n[0],r=n[1];return Object(O.jsx)(g.a,{sx:{boxSizing:"border-box",ml:1,mb:1,flex:1,border:function(e){return"1px solid ".concat(e.palette.divider)},borderRadius:1,overflow:"hidden"},children:Object(O.jsx)(ae,{tool:e,structure:c,setStructure:r})})},ue=n(107),se=n(113),le=n(112),be=null!==(c=null===(r="2660c18431bb286896a5faf26d0d268e6fa9a167\n")?void 0:r.substring(0,7))&&void 0!==c?c:"",de=null!==(i="2021/12/21 16:45:52")?i:"",je=null!==(a="0.1.0")?a:"",fe=function(){return Object(O.jsx)(le.a,{variant:"caption",sx:{ml:2},children:"ver ".concat(je," (").concat(be,": ").concat(de,")")})},Oe=function(){return Object(O.jsx)(ue.a,{position:"static",children:Object(O.jsxs)(se.a,{variant:"dense",children:[Object(O.jsx)(le.a,{component:"h1",variant:"h6",color:"inherit",children:"Drawing Sample"}),Object(O.jsx)(fe,{})]})})},xe=n(98),ve=n(99),he=n(100),ge=n(101),me=n(102),pe=n(103),Se=n(109),ye=n(105),Ce=["select","pen","force","trapezoid","delete"],we={select:{tool:"select",icon:Object(O.jsx)(xe.a,{}),label:"\u9078\u629e"},pen:{tool:"pen",icon:Object(O.jsx)(ve.a,{}),label:"\u6881\u8981\u7d20\u306e\u63cf\u753b"},force:{tool:"force",icon:Object(O.jsx)(he.a,{}),label:"\u96c6\u4e2d\u8377\u91cd\u306e\u8ffd\u52a0"},trapezoid:{tool:"trapezoid",icon:Object(O.jsx)(ge.a,{}),label:"\u5206\u5e03\u8377\u91cd\u306e\u8ffd\u52a0"},delete:{tool:"delete",icon:Object(O.jsx)(me.a,{}),label:"\u8981\u7d20\u306e\u524a\u9664"}},ke=function(e){var t=e.tool,n=e.onChange,c=Object(o.useCallback)((function(e,t){var c;null!==t&&("string"===typeof(c=t)&&Ce.some((function(e){return e===c})))&&n(t)}),[n]);return Object(O.jsxs)(pe.a,{sx:{width:160},alignItems:"flex-start",children:[Object(O.jsx)(le.a,{variant:"caption",children:"Toolbox"}),Object(O.jsx)(Se.a,{orientation:"vertical",value:t,exclusive:!0,fullWidth:!0,onChange:c,children:Object.entries(we).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1],r=c.icon,i=c.label;return Object(O.jsxs)(ye.a,{value:n,sx:{justifyContent:"flex-start",alignItems:"center"},children:[r,Object(O.jsx)(le.a,{variant:"caption",sx:{ml:1},children:i})]},n)}))})]})},Ee=function(){var e=Object(o.useContext)(x),t=e.tool,n=e.setTool;return Object(O.jsx)(ke,{tool:t,onChange:n})},Ie=function(){var e=Object(o.useState)({width:0,height:0}),t=Object(f.a)(e,2),n=t[0],c=t[1],r=Object(o.useCallback)((function(){var e=window,t=e.innerHeight,n=e.innerWidth;c({height:t,width:n})}),[]);return Object(o.useEffect)((function(){return r(),window.addEventListener("resize",r),function(){window.removeEventListener("resize",r)}}),[r]),Object(O.jsxs)(g.a,{sx:Object(h.a)(Object(h.a)({},n),{},{overflow:"hidden"}),children:[Object(O.jsx)(Oe,{}),Object(O.jsxs)(g.a,{sx:{boxSizing:"border-box",width:"auto",height:"calc(100% - 48px)",display:"flex",flexDirection:"row",flexWrap:"nowrap",alignItems:"stretch",pt:1,px:1},children:[Object(O.jsx)(Ee,{}),Object(O.jsx)(oe,{})]})]})},ze=Object(b.a)(),Me=function(){return Object(O.jsx)(d.a,{theme:ze,children:Object(O.jsxs)(v,{children:[Object(O.jsx)(j.a,{}),Object(O.jsx)(Ie,{})]})})},Ne=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,115)).then((function(t){var n=t.getCLS,c=t.getFID,r=t.getFCP,i=t.getLCP,a=t.getTTFB;n(e),c(e),r(e),i(e),a(e)}))};l.a.render(Object(O.jsx)(u.a.StrictMode,{children:Object(O.jsx)(Me,{})}),document.getElementById("root")),Ne()}},[[76,1,2]]]);
//# sourceMappingURL=main.3ad9a591.chunk.js.map