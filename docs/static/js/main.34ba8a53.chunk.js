(this["webpackJsonpdrawing-sample"]=this["webpackJsonpdrawing-sample"]||[]).push([[0],{76:function(e,t,n){"use strict";n.r(t);var c=n(0),r=n.n(c),o=n(54),i=n.n(o),a=n(57),s=n(109),u=n(113),b=n(8),j=n(1),l=Object(c.createContext)(void 0),d=function(e){var t=e.children,n=Object(c.useState)("select"),r=Object(b.a)(n,2),o=r[0],i=r[1];return Object(j.jsx)(l.Provider,{value:{tool:o,setTool:i},children:t})},O=n(9),f=n(110),h={unit:{force:"kN",length:"m"},nodes:[],beams:[],forces:[],trapezoids:[]},x=n(26),v=n(16),g=n(20),p=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:3,n=Math.pow(10,t),c=Math.round(e*n)/n;return c},m=n(105),w=function(e,t){return{id:Object(m.a)(),x:e,y:t}},C=n(29),y=n.n(C),k=function(e){var t=e.disabled,n=void 0!==t&&t,r=e.structure,o=e.onChange,i=Object(c.useState)([]),a=Object(b.a)(i,2),s=a[0],u=a[1],j=Object(c.useRef)(!1),l=Object(c.useCallback)((function(e){var t;if(!n){var c=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();c&&(j.current=!0,u([c.x,c.y]))}}),[n]),d=Object(c.useCallback)((function(e){var t;if(!n&&j.current){var c=null===(t=e.target.getStage())||void 0===t?void 0:t.getPointerPosition();c&&(j.current=!0,u((function(e){return[].concat(Object(g.a)(e),[c.x,c.y])})))}}),[n]),O=Object(c.useCallback)((function(){if(!n&&(j.current=!1,o&&s.length>=4)){var e=JSON.parse(JSON.stringify(r)),t=s.slice(0,2),c=s.slice(-2),i=w(t[0],t[1]),a=w(c[0],c[1]);e.nodes.push(i,a);var b=function(e,t,n){return{id:Object(m.a)(),name:e,nodeI:t,nodeJ:n}}("Beam_".concat(e.beams.length+1),i.id,a.id);e.beams.push(b),o(e),u([])}}),[n,o,s,r]);return Object(c.useEffect)((function(){n&&u([])}),[n]),{points:s,onPointerDown:l,onPointerMove:d,onPointerUp:O}},S=function(e){var t=e.points;return Object(j.jsx)(v.c,{children:Object(j.jsx)(v.d,{points:t,strokeWidth:3,stroke:"blue"})})},z=["nodeI","nodeJ"],I=["beam","force"],P=Object(c.createContext)(void 0),J=function(e){var t=e.children,n=e.tool,r=void 0===n?"select":n,o=e.size,i=e.structure,a=e.onChange,s=Object(c.useMemo)((function(){return i}),[i]),u=Object(c.useMemo)((function(){var e={};return s.nodes.forEach((function(t){e[t.id]=t})),e}),[s.nodes]),b=Object(c.useMemo)((function(){var e={};return s.beams.forEach((function(t){var n=t.nodeI,c=t.nodeJ,r=Object(x.a)(t,z),o=Object(O.a)(Object(O.a)({},r),{},{nodeI:u[n],nodeJ:u[c]});e[r.id]=o})),e}),[u,s.beams]),l=Object(c.useMemo)((function(){var e=s.forces,t={};if(e.length>0){var n=e.map((function(e){return e.force})).reduce((function(e,t){return e+t}))/e.length;e.forEach((function(e){var c=e.beam,r=e.force,o=Object(x.a)(e,I),i=r/n;t[o.id]=Object(O.a)(Object(O.a)({},o),{},{force:r,forceRatio:i,beam:b[c]})}))}return t}),[b,s]),d=Object(c.useCallback)((function(e){a&&a(e)}),[a]),f=Object(c.useCallback)((function(e){var t=function(e){return JSON.parse(JSON.stringify(e))}(s),n="Force_".concat(t.forces.length+1),c=function(e){return Object(O.a)(Object(O.a)({},e),{},{id:Object(m.a)()})}(Object(O.a)({name:n},e));t.forces.push(c),d(t)}),[d,s]);return Object(j.jsx)(P.Provider,{value:{tool:r,size:o,structure:s,nodes:u,beams:b,forces:l,addForce:f,setStructure:d},children:t})},M={id:"",points:[],stroke:"#c9e1ff",strokeWidth:1,dash:[5,3],listening:!1},E=function(){var e=Object(c.useContext)(P).size,t=Object(c.useMemo)((function(){for(var t=[],n=1,c=0;c<=e.height;c+=25)t.push(Object(O.a)(Object(O.a)({},M),{},{id:"Horizontal_".concat(n),points:[0,c,e.width,c]})),n++;return t}),[e.height,e.width]),n=Object(c.useMemo)((function(){for(var t=[],n=1,c=0;c<=e.width;c+=25)t.push(Object(O.a)(Object(O.a)({},M),{},{id:"Vertical_".concat(n),points:[c,0,c,e.height]})),n++;return t}),[e.height,e.width]);return Object(j.jsxs)(v.c,{listening:!1,children:[t.map((function(e){return Object(j.jsx)(v.d,Object(O.a)({},e),e.id)})),n.map((function(e){return Object(j.jsx)(v.d,Object(O.a)({},e),e.id)}))]})},R=function(e){var t=e.id,n=e.nodeI,r=e.nodeJ,o=Object(c.useContext)(P),i=o.tool,a=o.addForce,s=Object(c.useState)([]),u=Object(b.a)(s,2),l=u[0],d=u[1],O=Object(c.useRef)(new y.a(0,0)),f=Object(c.useRef)(new y.a(0,0)),h=Object(c.useCallback)((function(e){var n,c=null===(n=e.target.getStage())||void 0===n?void 0:n.getPointerPosition();if(c&&"force"===i){var r=new y.a(c.x,c.y),o=function(e,t,n,c){var r=t.distance(n),o=t.distance(c);return{beam:e,force:10,distanceI:p(o/r)}}(t,O.current,f.current,r);a(o),e.cancelBubble=!0}}),[a,t,i]);return Object(c.useEffect)((function(){d([n.x,n.y,r.x,r.y]),O.current.x=n.x,O.current.y=n.y,f.current.x=r.x,f.current.y=r.y}),[n.x,n.y,r.x,r.y]),Object(j.jsx)(v.d,{points:l,stroke:"black",strokeWidth:3,onClick:h,onTap:h})},W=function(e){var t=e.beam,n=e.distanceI,r=e.forceRatio,o=Object(c.useMemo)((function(){var e=t.nodeI,c=t.nodeJ,o=new y.a(e.x,e.y),i=new y.a(c.x,c.y),a=function(e,t,n){var c=t.clone().subtract(e).normalize(),r=e.distance(t),o=c.multiplyScalar(r*n);return e.clone().add(o)}(o,i,n),s=function(e,t){var n=t.clone().subtract(e).normalize();return new y.a(n.y,-1*n.x).normalize()}(o,i),u=a.clone().add(s.multiplyScalar(30*r));return[u.x,u.y,a.x,a.y]}),[t,n,r]);return Object(j.jsx)(v.a,{points:o,pointerLength:6,pointerWidth:6,fill:"orange",stroke:"orange",strokeWidth:2})},F=function(e){var t=e.x,n=e.y;return Object(j.jsx)(v.b,{x:t,y:n,fill:"black",radius:4})},T=function(){var e=Object(c.useContext)(P),t=e.nodes,n=e.beams,r=e.forces;return Object(j.jsxs)(v.c,{children:[Object.entries(t).map((function(e){var t=Object(b.a)(e,2),n=t[0],c=t[1];return Object(j.jsx)(F,Object(O.a)({},c),n)})),Object.entries(n).map((function(e){var t=Object(b.a)(e,2),n=t[0],c=t[1];return Object(j.jsx)(R,Object(O.a)({},c),n)})),Object.entries(r).map((function(e){var t=Object(b.a)(e,2),n=t[0],c=t[1];return Object(j.jsx)(W,Object(O.a)({},c),n)}))]})},B=["points"],L=function(e){var t=e.tool,n=e.structure,c=e.size,r=e.readonly,o=void 0!==r&&r,i=e.onChange,a=k({disabled:o||"pen"!==t,structure:n,onChange:i}),s=a.points,u=Object(x.a)(a,B);return Object(j.jsx)(v.e,Object(O.a)(Object(O.a)({width:c.width,height:c.height},u),{},{children:Object(j.jsxs)(J,{size:c,structure:n,tool:t,onChange:i,children:[Object(j.jsx)(E,{}),Object(j.jsx)(T,{}),Object(j.jsx)(S,{points:s})]})}))},N=["tool"],D=function(e){var t=e.tool,n=void 0===t?"select":t,r=Object(x.a)(e,N),o=Object(c.useState)({width:0,height:0}),i=Object(b.a)(o,2),a=i[0],s=i[1],u=Object(c.useRef)(null);return Object(c.useEffect)((function(){var e=new ResizeObserver((function(e){var t=e[0].contentRect,n=t.width,c=t.height;s({width:n,height:c})}));return u.current&&e.observe(u.current),function(){e.disconnect()}}),[]),Object(j.jsx)(f.a,{ref:u,sx:{width:"auto",height:"100%",backgroundColor:"#ffffff",overscrollBehavior:"contain"},children:Object(j.jsx)(L,Object(O.a)({size:a,tool:n},r))})},_=function(){var e=Object(c.useContext)(l).tool,t=Object(c.useState)(h),n=Object(b.a)(t,2),r=n[0],o=n[1];return Object(j.jsx)(f.a,{sx:{boxSizing:"border-box",ml:1,mb:1,flex:1,border:function(e){return"1px solid ".concat(e.palette.divider)},borderRadius:1,overflow:"hidden"},children:Object(j.jsx)(D,{tool:e,structure:r,onChange:o})})},H=n(106),U=n(111),V=n(112),q=function(){return Object(j.jsx)(H.a,{position:"static",children:Object(j.jsx)(U.a,{variant:"dense",children:Object(j.jsx)(V.a,{component:"h1",variant:"h6",color:"inherit",children:"Drawing Sample"})})})},A=n(98),G=n(99),K=n(100),Q=n(101),X=n(102),Y=n(108),Z=n(104),$=["select","pen","force","trapezoid"],ee={select:{tool:"select",icon:Object(j.jsx)(A.a,{}),label:"\u9078\u629e"},pen:{tool:"pen",icon:Object(j.jsx)(G.a,{}),label:"\u6881\u8981\u7d20\u306e\u63cf\u753b"},force:{tool:"force",icon:Object(j.jsx)(K.a,{}),label:"\u96c6\u4e2d\u8377\u91cd\u306e\u8ffd\u52a0"},trapezoid:{tool:"trapezoid",icon:Object(j.jsx)(Q.a,{}),label:"\u5206\u5e03\u8377\u91cd\u306e\u8ffd\u52a0"}},te=function(e){var t=e.tool,n=e.onChange,r=Object(c.useCallback)((function(e,t){var c;null!==t&&("string"===typeof(c=t)&&$.some((function(e){return e===c})))&&n(t)}),[n]);return Object(j.jsxs)(X.a,{sx:{width:160},alignItems:"flex-start",children:[Object(j.jsx)(V.a,{variant:"caption",children:"Toolbox"}),Object(j.jsx)(Y.a,{orientation:"vertical",value:t,exclusive:!0,fullWidth:!0,onChange:r,children:Object.entries(ee).map((function(e){var t=Object(b.a)(e,2),n=t[0],c=t[1],r=c.icon,o=c.label;return Object(j.jsxs)(Z.a,{value:n,sx:{justifyContent:"flex-start",alignItems:"center"},children:[r,Object(j.jsx)(V.a,{variant:"caption",sx:{ml:1},children:o})]},n)}))})]})},ne=function(){var e=Object(c.useContext)(l),t=e.tool,n=e.setTool;return Object(j.jsx)(te,{tool:t,onChange:n})},ce=function(){var e=Object(c.useState)({width:0,height:0}),t=Object(b.a)(e,2),n=t[0],r=t[1],o=Object(c.useCallback)((function(){var e=window,t=e.innerHeight,n=e.innerWidth;r({height:t,width:n})}),[]);return Object(c.useEffect)((function(){return o(),window.addEventListener("resize",o),function(){window.removeEventListener("resize",o)}}),[o]),Object(j.jsxs)(f.a,{sx:Object(O.a)(Object(O.a)({},n),{},{overflow:"hidden"}),children:[Object(j.jsx)(q,{}),Object(j.jsxs)(f.a,{sx:{boxSizing:"border-box",width:"auto",height:"calc(100% - 48px)",display:"flex",flexDirection:"row",flexWrap:"nowrap",alignItems:"stretch",pt:1,px:1},children:[Object(j.jsx)(ne,{}),Object(j.jsx)(_,{})]})]})},re=Object(a.a)(),oe=function(){return Object(j.jsx)(s.a,{theme:re,children:Object(j.jsxs)(d,{children:[Object(j.jsx)(u.a,{}),Object(j.jsx)(ce,{})]})})},ie=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,114)).then((function(t){var n=t.getCLS,c=t.getFID,r=t.getFCP,o=t.getLCP,i=t.getTTFB;n(e),c(e),r(e),o(e),i(e)}))};i.a.render(Object(j.jsx)(r.a.StrictMode,{children:Object(j.jsx)(oe,{})}),document.getElementById("root")),ie()}},[[76,1,2]]]);
//# sourceMappingURL=main.34ba8a53.chunk.js.map