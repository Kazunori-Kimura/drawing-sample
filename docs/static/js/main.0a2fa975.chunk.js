(this["webpackJsonpdrawing-sample"]=this["webpackJsonpdrawing-sample"]||[]).push([[0],{100:function(e,t,n){"use strict";n.r(t);var c,r,o,a,i=n(0),u=n.n(i),s=n(26),l=n.n(s),b=n(74),d=n(151),j=n(144),f=n(7),O=n(1),p=Object(i.createContext)(void 0),x=function(e){var t=e.children,n=Object(i.useState)("select"),c=Object(f.a)(n,2),r=c[0],o=c[1];return Object(O.jsx)(p.Provider,{value:{tool:r,setTool:o},children:t})},v=n(13),h=n(155),m={unit:{force:"kN",length:"m"},nodes:[],beams:[],forces:[],trapezoids:[]},g=n(28),y=n(18),S=n(19),C=function(e){return JSON.parse(JSON.stringify(e))},k=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:3,n=Math.pow(10,t),c=Math.round(e*n)/n;return c},E=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:25,n=e/t,c=Math.round(n)*t;return c},w=function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1],r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:25;return[E(n,r),E(c,r)]},P=n(147),I=function(e,t){return{id:Object(P.a)(),x:e,y:t}},z=n(46),N=n.n(z),T=new N.a(1,0),M=new N.a(0,1),_=function(e,t){var n=t.clone().subtract(e).normalize(),c=new N.a(n.y,-1*n.x).normalize();return M.dot(c)>0&&c.invert(),c},F=function(e){var t=e.disabled,n=void 0!==t&&t,c=e.snapSize,r=void 0===c?25:c,o=e.structure,a=e.setStructure,u=Object(i.useState)([]),s=Object(f.a)(u,2),l=s[0],b=s[1],d=Object(i.useRef)(!1),j=Object(i.useCallback)((function(e){var t;if(!n){var c=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();c&&(d.current=!0,b([c.x,c.y]))}}),[n]),O=Object(i.useCallback)((function(e){var t;if(!n&&d.current){var c=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();c&&(d.current=!0,b((function(e){return[].concat(Object(S.a)(e),[c.x,c.y])})))}}),[n]),p=Object(i.useCallback)((function(){if(!n&&(d.current=!1,a&&l.length>=4)){var e=C(o),t=l.slice(0,2),c=l.slice(-2),i=w([t[0],t[1]],r),u=w([c[0],c[1]],r),s=I.apply(void 0,Object(S.a)(i)),j=e.nodes.find((function(e){return e.x===s.x&&e.y===s.y}));j?s.id=j.id:e.nodes.push(s);var f=I.apply(void 0,Object(S.a)(u)),O=e.nodes.find((function(e){return e.x===f.x&&e.y===f.y}));O?f.id=O.id:e.nodes.push(f);var p=function(e,t,n){return{id:Object(P.a)(),name:e,nodeI:t,nodeJ:n}}("Beam_".concat(e.beams.length+1),s.id,f.id);e.beams.push(p),a(e),b([])}}),[n,l,a,r,o]);return Object(i.useEffect)((function(){n&&b([])}),[n]),{points:l,onPointerDown:j,onPointerMove:O,onPointerUp:p}},R=function(e){var t=e.points;return Object(O.jsx)(y.d,{children:Object(O.jsx)(y.e,{points:t,strokeWidth:3,stroke:"blue"})})},A=["nodeI","nodeJ"],X=["beam","force"],D=Object(i.createContext)(void 0),B=function(e){var t=e.children,n=e.tool,c=void 0===n?"select":n,r=e.size,o=e.gridSize,a=void 0===o?25:o,u=e.snapSize,s=void 0===u?25:u,l=e.structure,b=e.setStructure,d=Object(i.useMemo)((function(){var e={};return l.nodes.forEach((function(t){e[t.id]=t})),e}),[l.nodes]),j=Object(i.useMemo)((function(){var e={};return l.beams.forEach((function(t){var n=t.nodeI,c=t.nodeJ,r=Object(g.a)(t,A),o=Object(v.a)(Object(v.a)({},r),{},{nodeI:d[n],nodeJ:d[c]});e[r.id]=o})),e}),[d,l.beams]),f=Object(i.useMemo)((function(){var e=l.forces,t={};if(e.length>0){var n=e.map((function(e){return e.force})).reduce((function(e,t){return e+t}))/e.length;e.forEach((function(e){var c=e.beam,r=e.force,o=Object(g.a)(e,X),a=r/n;t[o.id]=Object(v.a)(Object(v.a)({},o),{},{force:r,forceRatio:a,beam:j[c]})}))}return t}),[j,l]),p=Object(i.useCallback)((function(e){var t=C(l),n="Force_".concat(t.forces.length+1),c=function(e){return Object(v.a)(Object(v.a)({},e),{},{id:Object(P.a)()})}(Object(v.a)({name:n},e));t.forces.push(c),b&&b(t)}),[b,l]),x=Object(i.useCallback)((function(e){var t=l.forces.findIndex((function(t){return t.id===e}));if(t>=0){var n=C(l);n.forces.splice(t,1),b&&b(n)}}),[b,l]),h=Object(i.useCallback)((function(e){var t=l.beams.findIndex((function(t){return t.id===e}));if(t>=0){var n=l.beams[t],c=n.nodeI,r=n.nodeJ,o=C(l);o.beams.splice(t,1),[c,r].forEach((function(e){var t=o.beams.some((function(t){var n=t.nodeI,c=t.nodeJ;return e===n||e===c}));if(!t){var n=o.nodes.findIndex((function(t){return t.id===e}));n>=0&&o.nodes.splice(n,1)}}));var a=o.forces.filter((function(t){return t.beam!==e}));o.forces=a;var i=o.trapezoids.filter((function(t){return t.beam!==e}));o.trapezoids=i,b&&b(o)}}),[b,l]);return Object(O.jsx)(D.Provider,{value:{tool:c,size:r,gridSize:a,snapSize:s,structure:l,nodes:d,beams:j,forces:f,addForce:p,deleteForce:x,deleteBeam:h,setStructure:b},children:t})},J={id:"",points:[],stroke:"#c9e1ff",strokeWidth:1,dash:[5,3],listening:!1},Y=function(){var e=Object(i.useContext)(D),t=e.size,n=e.gridSize,c=Object(i.useMemo)((function(){for(var e=[],c=1,r=0;r<=t.height;r+=n)e.push(Object(v.a)(Object(v.a)({},J),{},{id:"Horizontal_".concat(c),points:[0,r,t.width,r]})),c++;return e}),[n,t.height,t.width]),r=Object(i.useMemo)((function(){for(var e=[],c=1,r=0;r<=t.width;r+=n)e.push(Object(v.a)(Object(v.a)({},J),{},{id:"Vertical_".concat(c),points:[r,0,r,t.height]})),c++;return e}),[n,t.height,t.width]);return Object(O.jsxs)(y.d,{listening:!1,children:[c.map((function(e){return Object(O.jsx)(y.e,Object(v.a)({},e),e.id)})),r.map((function(e){return Object(O.jsx)(y.e,Object(v.a)({},e),e.id)}))]})},G=Object(i.createContext)(void 0),W=function(e){var t=e.value,n=t.selected,c=t.setSelected,r=e.children,o=Object(i.useCallback)((function(e){return n.some((function(t){var n=t.type,c=t.id;return n===e.type&&c===e.id}))}),[n]),a=Object(i.useCallback)((function(e){o(e)||c((function(t){return[].concat(Object(S.a)(t),[e])}))}),[o,c]),u=Object(i.useCallback)((function(e){o(e)?c((function(t){return t.filter((function(t){var n=t.type,c=t.id;return!(n===e.type&&c===e.id)}))})):c((function(t){return[].concat(Object(S.a)(t),[e])}))}),[o,c]);return Object(O.jsx)(G.Provider,{value:{selected:n,setSelected:c,isSelected:o,select:a,toggle:u},children:r})},L=function(e){var t=e.name,n=e.nodeI,c=e.nodeJ,r=e.tool,o=e.selected,a=void 0!==o&&o,u=e.addForce,s=e.onDelete,l=e.onSelect,b=Object(i.useState)([]),d=Object(f.a)(b,2),j=d[0],p=d[1],x=Object(i.useState)([0,0]),v=Object(f.a)(x,2),h=v[0],m=v[1],g=Object(i.useState)(0),S=Object(f.a)(g,2),C=S[0],k=S[1],E=Object(i.useState)(0),w=Object(f.a)(E,2),P=w[0],I=w[1],z=Object(i.useState)([[0,0],[0,0]]),T=Object(f.a)(z,2),M=T[0],F=T[1],R=Object(i.useRef)(new N.a(0,0)),A=Object(i.useRef)(new N.a(0,0)),X=Object(i.useCallback)((function(e){if("force"===r){var t,n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();n&&(u(n,R.current,A.current),e.cancelBubble=!0)}else"delete"===r?(s(),e.cancelBubble=!0):"select"===r&&(l(),e.cancelBubble=!0)}),[u,s,l,r]);return Object(i.useEffect)((function(){if(p([n.x,n.y,c.x,c.y]),R.current.x=n.x,R.current.y=n.y,A.current.x=c.x,A.current.y=c.y,a){var e=R.current,t=A.current;if(e.x>t.x){var r=[t,e];e=r[0],t=r[1]}var o=e.distance(t),i=_(e,t),u=e.clone().add(i.clone().multiplyScalar(16)),s=t.clone().subtract(e).angleDeg(),l=i.clone().multiplyScalar(75),b=e.clone().add(l),d=t.clone().add(l);k(o),m([u.x,u.y]),I(s),F([[b.x,b.y],[d.x,d.y]])}}),[n.x,n.y,c.x,c.y,a]),Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(y.e,{points:j,stroke:a?"blue":"black",strokeWidth:4,onClick:X,onTap:X}),a&&Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(y.g,{x:h[0],y:h[1],rotation:P,text:t,fontSize:12,width:C,fill:"blue",align:"center",wrap:"none",ellipsis:!0,listening:!1}),Object(O.jsx)($,{start:M[0],end:M[1]})]})]})},V=function(e){var t=Object(i.useContext)(D),n=t.tool,c=t.addForce,r=t.deleteBeam,o=Object(i.useContext)(G),a=o.isSelected,u=o.toggle,s=Object(i.useCallback)((function(t,n,r){var o=new N.a(t.x,t.y),a=function(e,t,n,c){var r=t.distance(n),o=t.distance(c);return{beam:e,force:10,distanceI:k(o/r)}}(e.id,n,r,o);c(a)}),[c,e.id]),l=Object(i.useCallback)((function(){r(e.id)}),[r,e.id]),b=Object(i.useCallback)((function(){u({type:"beams",id:e.id})}),[e.id,u]);return Object(O.jsx)(L,Object(v.a)(Object(v.a)({},e),{},{tool:n,selected:a({type:"beams",id:e.id}),addForce:s,onDelete:l,onSelect:b}))},H=Object(i.createContext)(void 0),q=function(e){var t=e.value,n=t.popupType,c=t.setPopupType,r=t.popupPosition,o=t.setPopupPosition,a=e.children,u=Object(i.useState)({}),s=Object(f.a)(u,2),l=s[0],b=s[1],d=Object(i.useCallback)((function(e,t,n){c(e),o(t),n&&b(n)}),[o,c]),j=Object(i.useCallback)((function(){c(void 0),o({top:0,left:0}),b({})}),[o,c]);return Object(O.jsx)(H.Provider,{value:{popupType:n,setPopupType:c,popupPosition:r,setPopupPosition:o,open:d,close:j,popupParams:l},children:a})},K=function(e){var t=e.beam,n=e.distanceI,c=e.force,r=e.forceRatio,o=e.tool,a=e.selected,u=void 0!==a&&a,s=e.onDelete,l=e.onSelect,b=e.onEdit,d=Object(i.useState)([]),j=Object(f.a)(d,2),p=j[0],x=j[1],v=Object(i.useState)(0),h=Object(f.a)(v,2),m=h[0],g=h[1],S=Object(i.useState)(0),C=Object(f.a)(S,2),k=C[0],E=C[1],w=Object(i.useState)([0,0]),P=Object(f.a)(w,2),I=P[0],z=P[1],M=Object(i.useRef)(new N.a(0,0)),F=Object(i.useRef)(new N.a(0,0));Object(i.useEffect)((function(){var e=t.nodeI,c=t.nodeJ;M.current.x=e.x,M.current.y=e.y,F.current.x=c.x,F.current.y=c.y;var o=function(e,t,n){if(n>=1)return t;if(n<=0)return e;var c=t.clone().subtract(e).normalize(),r=e.distance(t),o=c.multiplyScalar(r*n);return e.clone().add(o)}(M.current,F.current,n),a=_(M.current,F.current),i=30*r,u=o.clone().add(a.multiplyScalar(i));x([u.x,u.y,o.x,o.y]),g(Math.max(i,140));var s=a.clone().angleDeg();E(s);var l=M.current.clone().subtract(F.current).normalize();T.dot(l)<0&&l.invert();var b=o.clone().add(l.multiplyScalar(6));z([b.x,b.y])}),[t,n,r]);var R=Object(i.useCallback)((function(e){"delete"===o?(s(),e.cancelBubble=!0):"select"===o&&(l(),e.cancelBubble=!0)}),[s,l,o]),A=Object(i.useCallback)((function(e){e.cancelBubble=!0}),[]),X=Object(i.useCallback)((function(e){var t;console.log(e);var n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();if(n){var c=n.x,r=n.y;b({top:r,left:c})}}),[b]),D=Object(i.useMemo)((function(){return u?"red":"orange"}),[u]);return Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(y.a,{points:p,pointerLength:6,pointerWidth:6,fill:D,stroke:D,strokeWidth:2,onClick:R,onTap:R}),u&&Object(O.jsx)(y.g,{x:I[0],y:I[1],offsetX:-6,text:"".concat(c,"kN"),fontSize:12,width:m,rotation:k,fill:D,wrap:"none",ellipsis:!0,onClick:A,onTap:A,onDblClick:X,onDblTap:X})]})},U=function(e){var t=Object(i.useContext)(D),n=t.tool,c=t.deleteForce,r=Object(i.useContext)(G),o=r.isSelected,a=r.toggle,u=Object(i.useContext)(H).open,s=Object(i.useCallback)((function(){c(e.id)}),[c,e.id]),l=Object(i.useCallback)((function(){a({type:"forces",id:e.id})}),[e.id,a]),b=Object(i.useCallback)((function(t){var n=Object(v.a)(Object(v.a)({},e),{},{beam:e.beam.id});u("forces",t,n)}),[u,e]);return Object(O.jsx)(K,Object(v.a)(Object(v.a)({},e),{},{tool:n,selected:o({type:"forces",id:e.id}),onDelete:s,onSelect:l,onEdit:b}))},Q={fill:"silver",stroke:"silver",strokeWidth:1,listening:!1},Z=Object(v.a)({pointerLength:6,pointerWidth:6,pointerAtBeginning:!0},Q),$=function(e){var t=e.start,n=e.end,c=Object(i.useRef)(new N.a(0,0)),r=Object(i.useRef)(new N.a(0,0)),o=Object(i.useState)(0),a=Object(f.a)(o,2),u=a[0],s=a[1],l=Object(i.useState)(0),b=Object(f.a)(l,2),d=b[0],j=b[1],p=Object(i.useState)([0,0]),x=Object(f.a)(p,2),h=x[0],m=x[1];return Object(i.useEffect)((function(){c.current.x=t[0],c.current.y=t[1],r.current.x=n[0],r.current.y=n[1];var e=c.current.distance(r.current),o=r.current.clone().subtract(c.current).normalize().angleDeg();s(Math.round(e)),j(90===o?-90:o),m(90===o?n:t)}),[n,t]),Object(O.jsxs)(y.c,{x:h[0],y:h[1],rotation:d,children:[Object(O.jsx)(y.e,Object(v.a)({points:[0,0,0,10]},Q)),Object(O.jsx)(y.a,Object(v.a)({points:[0,5,u,5]},Z)),Object(O.jsx)(y.e,Object(v.a)({points:[u,0,u,10]},Q)),Object(O.jsx)(y.g,{x:0,y:-8,text:"".concat(u,"px"),fontSize:12,fill:"silver",width:u,align:"center",listening:!1,wrap:"none",ellipsis:!0})]})},ee=function(e){var t=e.id,n=e.x,c=e.y,r=e.draggable,o=void 0!==r&&r,a=e.onChange,u=e.onCommit,s=Object(i.useState)(!1),l=Object(f.a)(s,2),b=l[0],d=l[1],j=Object(i.useRef)({x:n,y:c}),p=Object(i.useRef)(),x=Object(i.useCallback)((function(){if(o){var e={id:t,x:j.current.x,y:j.current.y};a&&a(e)}}),[o,t,a]),v=Object(i.useCallback)((function(e){var t,n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();n&&(j.current=n,d(!0))}),[]),h=Object(i.useCallback)((function(e){var t,n=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();n&&(j.current=n)}),[]),m=Object(i.useCallback)((function(e){var n,c=null===(n=e.target.getStage())||void 0===n?void 0:n.getPointerPosition();if(c){j.current=c,d(!1),p.current&&(clearInterval(p.current),p.current=void 0);var r={id:t,x:j.current.x,y:j.current.y};u&&u(r)}}),[t,u]);return Object(i.useEffect)((function(){var e=p.current;return o&&b&&(x(),p.current=setInterval(x,100)),function(){e&&clearInterval(e)}}),[o,b,x]),Object(O.jsx)(y.b,{id:t,x:n,y:c,fill:b?"blue":"black",radius:4,draggable:o,onDragStart:v,onDragMove:h,onDragEnd:m,_useStrictMode:!0})},te=function(e){var t=Object(i.useContext)(D),n=t.tool,c=t.snapSize,r=t.setStructure,o=Object(i.useMemo)((function(){return"pen"!==n&&Boolean(r)}),[r,n]),a=Object(i.useCallback)((function(e){var t=e.id,n=e.x,o=e.y;if(r){var a=w([n,o],c),i=Object(f.a)(a,2),u=i[0],s=i[1];r((function(e){var n=C(e),c=n.nodes.find((function(e){return e.id===t}));return c&&(c.x=u,c.y=s),n}))}}),[r,c]),u=Object(i.useCallback)((function(e){var t=e.id,n=e.x,o=e.y;if(r){var a=w([n,o],c),i=Object(f.a)(a,2),u=i[0],s=i[1];r((function(e){var n,c,r,o=C(e),a=o.nodes.findIndex((function(e){return e.id===t}));if(a>=0){var i=o.nodes.find((function(e){return e.id!==t&&e.x===u&&e.y===s}));i&&(n=o,c=t,r=i.id,n.beams.forEach((function(e){e.nodeI===c&&(e.nodeI=r),e.nodeJ===c&&(e.nodeJ=r)})),o.nodes.splice(a,1))}return o}))}}),[r,c]);return Object(O.jsx)(ee,Object(v.a)(Object(v.a)({},e),{},{draggable:o,onChange:a,onCommit:u}))},ne=25,ce=function(){var e=Object(i.useContext)(D).nodes,t=Object(i.useMemo)((function(){var t={maxX:Number.MIN_SAFE_INTEGER,minX:Number.MAX_SAFE_INTEGER,guidesX:[],maxY:Number.MIN_SAFE_INTEGER,minY:Number.MAX_SAFE_INTEGER,guidesY:[]},n=new Set,c=new Set;if(Object.values(e).forEach((function(e){var r=e.x,o=e.y;t.maxX<r&&(t.maxX=r),t.minX>r&&(t.minX=r),n.has(r)||n.add(r),t.maxY<o&&(t.maxY=o),t.minY>o&&(t.minY=o),c.has(o)||c.add(o)})),n.size>1)for(var r=Array.from(n).sort((function(e,t){return e<t?-1:1})),o=r[0],a=1;a<r.length;a++){var i=r[a],u={key:"LocalGuideX_".concat(a),start:[o,t.maxY+100],end:[i,t.maxY+100]};o=i,t.guidesX.push(u)}if(c.size>1)for(var s=Array.from(c).sort((function(e,t){return e<t?-1:1})),l=s[0],b=Math.max(t.minX-100,50),d=1;d<s.length;d++){var j=s[d],f={key:"LocalGuideY_".concat(d),start:[b,l],end:[b,j]};l=j,t.guidesY.push(f)}return t}),[e]),n=t.minX,c=t.maxX,r=t.guidesX,o=t.minY,a=t.maxY,u=t.guidesY,s=Object(i.useMemo)((function(){return n!==Number.MAX_SAFE_INTEGER?Math.max(ne,n-125):0}),[n]),l=Object(i.useMemo)((function(){return a!==Number.MIN_SAFE_INTEGER?a+125:0}),[a]);return Object(O.jsxs)(y.d,{listening:!1,children:[n!==Number.MAX_SAFE_INTEGER&&c!==Number.MIN_SAFE_INTEGER&&Object(O.jsx)($,{start:[n,l],end:[c,l]}),r.map((function(e){return Object(O.jsx)($,Object(v.a)({},e))})),o!==Number.MAX_SAFE_INTEGER&&a!==Number.MIN_SAFE_INTEGER&&Object(O.jsx)($,{start:[s,o],end:[s,a]}),u.map((function(e){return Object(O.jsx)($,Object(v.a)({},e))}))]})},re=n(75),oe=n(152),ae=n(137),ie=n(145),ue=n(153),se=n(149),le=["values"],be=function(e){var t=e.force,n=e.onChange,c=e.onClose,r=Object(i.useState)(""),o=Object(f.a)(r,2),a=o[0],u=o[1],s=Object(i.useState)(),l=Object(f.a)(s,2),b=l[0],d=l[1],j=Object(i.useCallback)((function(e){if(e.preventDefault(),e.currentTarget.checkValidity()&&"undefined"===typeof b){var r=parseFloat(a);isNaN(r)||(n(Object(v.a)(Object(v.a)({},t),{},{force:r})),c())}}),[b,n,c,a,t]),p=Object(i.useCallback)((function(e){var t,n=e.currentTarget.value;u(n),0===n.length&&(t="\u6570\u5024\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044");var c=parseFloat(n);isNaN(c)&&(t="\u6570\u5024\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044"),(0>c||c>Number.MAX_SAFE_INTEGER)&&(t="0 \u3088\u308a\u5927\u304d\u3044\u5024\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044"),d(t)}),[]);return Object(i.useEffect)((function(){u("".concat(t.force)),d(void 0)}),[t]),Object(O.jsx)(oe.a,{children:Object(O.jsxs)(ae.a,{direction:"column",spacing:1,sx:{p:1,width:240},component:"form",autoComplete:"off",noValidate:!0,onSubmit:j,children:[Object(O.jsx)(ie.a,{variant:"outlined",margin:"dense",size:"small",label:"\u96c6\u4e2d\u8377\u91cd",value:a,required:!0,fullWidth:!0,onChange:p,InputProps:{endAdornment:Object(O.jsx)(ue.a,{position:"end",children:"kN"})},error:Boolean(b),helperText:b}),Object(O.jsxs)(ae.a,{direction:"row",justifyContent:"flex-end",spacing:1,children:[Object(O.jsx)(se.a,{size:"small",onClick:c,children:"\u30ad\u30e3\u30f3\u30bb\u30eb"}),Object(O.jsx)(se.a,{type:"submit",size:"small",variant:"contained",children:"OK"})]})]})})},de=function(e){var t=e.values,n=Object(g.a)(e,le),c=Object(i.useMemo)((function(){return function(e){if(e&&"object"===typeof e){var t=e;return"string"===typeof t.id&&"string"===typeof t.name&&"string"===typeof t.beam&&"number"===typeof t.force&&"number"===typeof t.distanceI}return!1}(t)?t:{id:"",name:"",beam:"",force:0,distanceI:0}}),[t]);return Object(O.jsx)(be,Object(v.a)(Object(v.a)({},n),{},{force:c}))},je=function(){var e=Object(i.useContext)(H),t=e.popupType,n=e.popupPosition,c=e.popupParams,r=e.close,o=Object(i.useContext)(D).setStructure,a=Object(i.useMemo)((function(){var e=n.top,t=n.left;return{style:{zIndex:5e3,top:"".concat(e,"px"),left:"".concat(t,"px")}}}),[n]),u=Object(i.useCallback)((function(e){o&&o((function(t){var n=C(t),c=n.forces.findIndex((function(t){return t.id===e.id}));return c>=0&&(n.forces[c]=Object(v.a)({},e)),n}))}),[o]);return"undefined"===typeof t?null:Object(O.jsx)(re.a,{divProps:a,children:"forces"===t&&Object(O.jsx)(de,{values:null!==c&&void 0!==c?c:{},onClose:r,onChange:u})})},fe=function(){var e=Object(i.useContext)(D),t=e.nodes,n=e.beams,c=e.forces;return Object(O.jsxs)(y.d,{children:[Object.entries(n).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1];return Object(O.jsx)(V,Object(v.a)({},c),n)})),Object.entries(t).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1];return Object(O.jsx)(te,Object(v.a)({},c),n)})),Object.entries(c).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1];return Object(O.jsx)(U,Object(v.a)({},c),n)})),Object(O.jsx)(je,{})]})},Oe=["points"],pe=function(e){var t=e.tool,n=e.structure,c=e.size,r=e.readonly,o=void 0!==r&&r,a=e.setStructure,u=Object(i.useContext)(G),s=u.selected,l=u.setSelected,b=Object(i.useContext)(H),d=b.popupType,j=b.setPopupType,f=b.popupPosition,p=b.setPopupPosition,x=b.close,h=F({disabled:o||"pen"!==t,structure:n,setStructure:a}),m=h.points,S=Object(g.a)(h,Oe),C=Object(i.useCallback)((function(e){x(),"select"===t&&l([])}),[x,l,t]);return Object(O.jsx)(y.f,Object(v.a)(Object(v.a)({width:c.width,height:c.height},S),{},{onClick:C,onTap:C,children:Object(O.jsx)(B,{size:c,structure:n,tool:t,setStructure:a,children:Object(O.jsx)(q,{value:{popupType:d,setPopupType:j,popupPosition:f,setPopupPosition:p},children:Object(O.jsxs)(W,{value:{selected:s,setSelected:l},children:[Object(O.jsx)(Y,{}),Object(O.jsx)(ce,{}),Object(O.jsx)(fe,{}),Object(O.jsx)(R,{points:m})]})})})}))},xe=["tool"],ve=function(e){var t=e.tool,n=void 0===t?"select":t,c=Object(g.a)(e,xe),r=Object(i.useState)({width:0,height:0}),o=Object(f.a)(r,2),a=o[0],u=o[1],s=Object(i.useState)([]),l=Object(f.a)(s,2),b=l[0],d=l[1],j=Object(i.useState)(),p=Object(f.a)(j,2),x=p[0],m=p[1],y=Object(i.useState)({top:0,left:0}),S=Object(f.a)(y,2),C=S[0],k=S[1],E=Object(i.useRef)(null);return Object(i.useEffect)((function(){var e=new ResizeObserver((function(e){var t=e[0].contentRect,n=t.width,c=t.height;u({width:n,height:c})}));return E.current&&e.observe(E.current),function(){e.disconnect()}}),[]),Object(O.jsx)(h.a,{ref:E,sx:{width:"auto",height:"100%",backgroundColor:"#ffffff",overscrollBehavior:"contain"},children:Object(O.jsx)(q,{value:{popupType:x,setPopupType:m,popupPosition:C,setPopupPosition:k},children:Object(O.jsx)(W,{value:{selected:b,setSelected:d},children:Object(O.jsx)(pe,Object(v.a)({size:a,tool:n},c))})})})},he=function(){var e=Object(i.useContext)(p).tool,t=Object(i.useState)(m),n=Object(f.a)(t,2),c=n[0],r=n[1];return Object(O.jsx)(h.a,{sx:{boxSizing:"border-box",ml:1,mb:1,flex:1,border:function(e){return"1px solid ".concat(e.palette.divider)},borderRadius:1,overflow:"hidden"},children:Object(O.jsx)(ve,{tool:e,structure:c,setStructure:r})})},me=n(156),ge=n(157),ye=n(154),Se=null!==(c=null===(r="f056159843c986eafd3ec36dba0ff3776faf60c6\n")?void 0:r.substring(0,7))&&void 0!==c?c:"",Ce=null!==(o="2021/12/22 15:40:17")?o:"",ke=null!==(a="0.1.0")?a:"",Ee=function(){return Object(O.jsx)(ye.a,{variant:"caption",sx:{ml:2},children:"ver ".concat(ke," (").concat(Se,": ").concat(Ce,")")})},we=function(){return Object(O.jsx)(me.a,{position:"static",children:Object(O.jsxs)(ge.a,{variant:"dense",children:[Object(O.jsx)(ye.a,{component:"h1",variant:"h6",color:"inherit",children:"Drawing Sample"}),Object(O.jsx)(Ee,{})]})})},Pe=n(139),Ie=n(140),ze=n(141),Ne=n(142),Te=n(143),Me=n(150),_e=n(158),Fe=["select","pen","force","trapezoid","delete"],Re={select:{tool:"select",icon:Object(O.jsx)(Pe.a,{}),label:"\u9078\u629e"},pen:{tool:"pen",icon:Object(O.jsx)(Ie.a,{}),label:"\u6881\u8981\u7d20\u306e\u63cf\u753b"},force:{tool:"force",icon:Object(O.jsx)(ze.a,{}),label:"\u96c6\u4e2d\u8377\u91cd\u306e\u8ffd\u52a0"},trapezoid:{tool:"trapezoid",icon:Object(O.jsx)(Ne.a,{}),label:"\u5206\u5e03\u8377\u91cd\u306e\u8ffd\u52a0"},delete:{tool:"delete",icon:Object(O.jsx)(Te.a,{}),label:"\u8981\u7d20\u306e\u524a\u9664"}},Ae=function(e){var t=e.tool,n=e.onChange,c=Object(i.useCallback)((function(e,t){var c;null!==t&&("string"===typeof(c=t)&&Fe.some((function(e){return e===c})))&&n(t)}),[n]);return Object(O.jsxs)(ae.a,{sx:{width:160},alignItems:"flex-start",children:[Object(O.jsx)(ye.a,{variant:"caption",children:"Toolbox"}),Object(O.jsx)(Me.a,{orientation:"vertical",value:t,exclusive:!0,fullWidth:!0,onChange:c,children:Object.entries(Re).map((function(e){var t=Object(f.a)(e,2),n=t[0],c=t[1],r=c.icon,o=c.label;return Object(O.jsxs)(_e.a,{value:n,sx:{justifyContent:"flex-start",alignItems:"center"},children:[r,Object(O.jsx)(ye.a,{variant:"caption",sx:{ml:1},children:o})]},n)}))})]})},Xe=function(){var e=Object(i.useContext)(p),t=e.tool,n=e.setTool;return Object(O.jsx)(Ae,{tool:t,onChange:n})},De=function(){var e=Object(i.useState)({width:0,height:0}),t=Object(f.a)(e,2),n=t[0],c=t[1],r=Object(i.useCallback)((function(){var e=window,t=e.innerHeight,n=e.innerWidth;c({height:t,width:n})}),[]);return Object(i.useEffect)((function(){return r(),window.addEventListener("resize",r),function(){window.removeEventListener("resize",r)}}),[r]),Object(O.jsxs)(h.a,{sx:Object(v.a)(Object(v.a)({},n),{},{overflow:"hidden"}),children:[Object(O.jsx)(we,{}),Object(O.jsxs)(h.a,{sx:{boxSizing:"border-box",width:"auto",height:"calc(100% - 48px)",display:"flex",flexDirection:"row",flexWrap:"nowrap",alignItems:"stretch",pt:1,px:1},children:[Object(O.jsx)(Xe,{}),Object(O.jsx)(he,{})]})]})},Be=Object(b.a)(),Je=function(){return Object(O.jsx)(d.a,{theme:Be,children:Object(O.jsxs)(x,{children:[Object(O.jsx)(j.a,{}),Object(O.jsx)(De,{})]})})},Ye=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,159)).then((function(t){var n=t.getCLS,c=t.getFID,r=t.getFCP,o=t.getLCP,a=t.getTTFB;n(e),c(e),r(e),o(e),a(e)}))};l.a.render(Object(O.jsx)(u.a.StrictMode,{children:Object(O.jsx)(Je,{})}),document.getElementById("root")),Ye()}},[[100,1,2]]]);
//# sourceMappingURL=main.0a2fa975.chunk.js.map