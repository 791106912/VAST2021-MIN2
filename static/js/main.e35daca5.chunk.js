(this["webpackJsonpvast-2020"]=this["webpackJsonpvast-2020"]||[]).push([[0],{105:function(e,t,n){},106:function(e,t,n){},108:function(e,t,n){},110:function(e,t,n){},111:function(e,t,n){"use strict";n.r(t);var a=n(4),c=n.n(a),r=n(78),i=n.n(r),s=(n(105),n(106),n(9)),u=n(2),o=n(114),l=(n(13),n(75),n(3)),d=n(5),j=n.n(d),b=(n(108),n(0));var f=n(7),O=n(80),m=n(112),h=n(6),p=n(113),x=n(116),g=n(117),v=[1388937600,1389024e3,1389110400,1389196800,1389283200,1389369600,1389456e3,1389542400,1389628800,1389715200,1389801600,1389888e3,1389974400,1390060800],y=[{type:"restaurant",data:["Brew've Been Served","Hallowed Grounds","Coffee Cameleon","Coffee Shack","Bean There Done That","Jack's Magical Beans","Brewed Awakenings","Katerinas Caf","Gelatogalore","Ouzeri Elian","Kalami Kafenion","Hippokampos","Abila Zacharo","Guy's Gyros"]},{type:"parter",data:["Abila Airport","Nationwide Refinery","Maximum Iron and Steel","Carlyle Chemical Inc.","Abila Scrapyard","Octavio's Office Supplies","Chostus Hotel","Frank's Fuel","Kronos Pipe and Irrigation","Stewart and Sons Fabrication"]},{type:"shop",data:["Albert's Fine Clothing","Kronos Mart","Daily Dealz","Shoppers' Delight","Ahaggo Museum"]},{type:"entertainment",data:["Desafio Golf Course","Roberts and Sons"]},{type:"other",data:["U-Pump","General Grocer","Frydos Autosupply n' More"]}],N=[{data:[-2,6],name:"Sleeping"},{data:[6,9],name:"On the way to work"},{data:[9,12],name:"Working"},{data:[12,14],name:"Lunch Break"},{data:[14,18],name:"Working"},{data:[18,22],name:"After work"}];n(110);function A(e,t){return parseFloat((Number(e)+Number(t)).toFixed(10))}function k(){var e=800,t=800,n=[[0,100],[100,240],[370,371],[270,300],[320,350]],c=Object(h.b)().domain([0,24]).range([0,360]),r=Object(h.b)().domain(Object(u.d)(v)).range([n[1][0],n[1][1]]),i="2020-01-01",d=Object(a.useState)(!0),k=Object(s.a)(d,2),S=k[0],R=k[1],C=Object(a.useState)("mulitiple"),w=Object(s.a)(C,2),I=w[0],P=w[1];function F(e,t){var n=Object(O.a)(e);return"single"!==I?n.includes(t)?n.filter((function(e){return e!==t})):(n.push(t),n):n.includes(t)?[]:[t]}var B=Object(h.b)().domain(["".concat(i," 00:00:00"),"".concat(i," 23:59:59")].map((function(e){return j()(e).unix()}))).range([0,2*Math.PI]),T=Object(p.a)().innerRadius((function(e){return r(e.day)})).outerRadius((function(e){return r(e.day)+(n[1][1]-n[1][0])/v.length})).startAngle((function(e){return B(e.time)})).endAngle((function(e){return B(e.time+500)})),D=Object(a.useState)([]),q=Object(s.a)(D,2),G=q[0],K=q[1],E=Object(a.useState)([]),J=Object(s.a)(E,2),Y=J[0],H=J[1],L=Object(a.useState)([]),z=Object(s.a)(L,2),W=z[0],_=z[1],U=Object(a.useState)([]),Z=Object(s.a)(U,2),Q=Z[0],V=Z[1],X=Object(a.useMemo)((function(){return G.filter((function(e){return!Y.length||Y.includes(e.location)})).filter((function(e){return!Q.length||Q.includes(e.last4ccnum)}))}),[Y,G,Q]),$=Object(a.useState)([]),ee=Object(s.a)($,2),te=ee[0],ne=ee[1],ae=Object(a.useMemo)((function(){return Object(l.chain)(X).map("last4ccnum").uniq().value()}),[X]),ce=Object(a.useMemo)((function(){var e=Object(u.d)(X,(function(e){return Number(e.price)}));return Object(h.b)().domain(e).range([.2,1])}),[X]);Object(a.useEffect)((function(){var e=new Promise((function(e){Object(o.a)("./data/cc_data.csv").then((function(t){console.log(t);var n=t.map((function(e){var t=e.timestamp.split(" "),n=Object(s.a)(t,2),a=n[0],c=n[1],r=j()(a).unix(),u=j()("".concat(i," ").concat(c,":00")).unix(),o=y.find((function(t){return t.data.includes(e.location)})).type;return Object(f.a)(Object(f.a)({},e),{},{day:r,dayStr:a,time:u,locationType:o,hour:c.split(":")[0]})})),a=Object(l.chain)(t).map("last4ccnum").uniq().value();ne(a),K(n),e(t)}))})),t=new Promise((function(e){Object(o.a)("./data/loyalty_data.csv").then((function(t){e(t)}))}));Promise.all([e,t]).then((function(e){}))}),[]);var re=Object(a.useMemo)((function(){return X.reduce((function(e,t){var n=e[t.location]||0,a=parseFloat((n+Number(t.price)).toFixed(10));return e[t.location]=a,e}),{})}),[X]),ie=Object(a.useMemo)((function(){var e=Object(u.d)(Object.values(re));return Object(h.b)().domain(e).range([.2,1])}),[re]),se=Object(l.chain)(y).map("data").flatten().value(),ue=Object(h.b)().domain([0,se.length]).range([0,2*Math.PI]),oe=Object(p.a)().innerRadius((function(e){return n[4][0]})).outerRadius((function(e){return n[4][1]})).startAngle((function(e){var t=e.type,n=y.findIndex((function(e){return e.type===t})),a=Object(l.chain)(y).slice(0,n).map("data").flatten().value().length;return ue(a)})).endAngle((function(e){var t=e.type,n=y.findIndex((function(e){return e.type===t})),a=Object(l.chain)(y).slice(0,n+1).map("data").flatten().value().length;return ue(a)})).padAngle(.01).cornerRadius(4),le=Object(p.a)().innerRadius((function(e){return n[3][0]})).outerRadius((function(e){return n[3][1]})).startAngle((function(e){var t=se.indexOf(e);return ue(t)})).endAngle((function(e){var t=se.indexOf(e);return ue(t+1)})).padAngle(.01).cornerRadius(4),de=Object(p.a)().innerRadius((function(e){return n[2][0]})).outerRadius((function(e){return n[2][1]})).startAngle((function(e){return e[0]<0?B(j()("2019-12-31 ".concat(22,":00:00")).unix()):B(j()("".concat(i," ").concat(e[0],":00:00")).unix())})).endAngle((function(e){return B(j()("".concat(i," ").concat(e[1],":00:00")).unix())})).padAngle(.1).cornerRadius(4),je=function(e){if(!e.innerRadius||!e.outerRadius)return"";var t=[e.startAngle,e.endAngle].map((function(e){return e-Math.PI/2})),n=Math.max(0,(e.outerRadius+e.innerRadius)/2),a=(t[1]+t[0])/2,c=a>0&&a<Math.PI;c&&t.reverse();var r=Object(m.a)();return r.arc(0,0,n,t[0],t[1],c),r.toString()},be=Object(h.c)(y.map((function(e){return e.type})).sort(u.a),h.e),fe=Object(a.useMemo)((function(){return te.reduce((function(e,t){var n=Object(l.chain)(X).filter((function(e){return e.last4ccnum===t})).reduce((function(e,t){var n=t.dayStr;return e[n]||(e[n]=[]),e[n].push(T.centroid(t)),e}),{}).values().value();return e[t]=n,e}),{})}),[te,X,T]),Oe=Object(a.useMemo)((function(){return Object(l.chain)(X).map((function(e){return e.dayStr.replace("/2014","")})).uniq().value()}),[X]),me=Object(x.a)().x((function(e){return e[0]})).y((function(e){return e[1]})).curve(g.a.alpha(.5)),he=["01/11","01/12","01/18","01/19"];return Object(b.jsxs)("div",{className:"graph",children:[Object(b.jsx)("svg",{height:e,width:t,className:"main",children:Object(b.jsxs)("g",{transform:"translate(".concat(10,", ").concat(10,")"),children:[Object(b.jsx)("g",{className:"timebg",children:v.map((function(e,t){var n=j()(1e3*e).format("MM/DD"),a=Oe.includes(n)?1:0;return Object(b.jsxs)("g",{children:[Object(b.jsxs)("text",{opacity:a,transform:"translate(".concat(400,", ").concat(400-r(e),")"),children:[n," ",he.includes(n)?"weekend":""]}),Object(b.jsx)("circle",{cx:400,cy:400,r:r(e)})]},e)}))}),Object(b.jsx)("g",{className:"timeTick",children:[6,9,12,14,18,22].map((function(e,t){var a={x1:400,y1:400-n[2][0],x2:400,y2:400};return Object(b.jsxs)("g",{className:"timeSplit",transform:"rotate(".concat(c(e),")"),children:[Object(b.jsx)("line",Object(f.a)({},a)),Object(b.jsx)("text",{x:a.x1,y:a.y1,dy:0,children:"".concat(e,":00")})]},e)}))}),Object(b.jsx)("g",{className:"time-classify",transform:"translate(".concat(400,", ").concat(400,")"),children:N.map((function(e,t){var a={d:de(e.data)},c={fill:"none",id:"time-".concat(t),d:je({innerRadius:n[2][1]+10,outerRadius:n[2][1]+10,startAngle:e.data[0]<0?B(j()("2019-12-31 ".concat(22,":00:00")).unix()):B(j()("".concat(i," ").concat(e.data[0],":00:00")).unix()),endAngle:B(j()("".concat(i," ").concat(e.data[1],":00:00")).unix())})},r={href:"#time-".concat(t),startOffset:"50%",dominantBaseline:"middle"};return Object(b.jsxs)("g",{children:[Object(b.jsx)("path",Object(f.a)(Object(f.a)({},a),{},{className:"time-button"})),Object(b.jsxs)("g",{className:"time-label",children:[Object(b.jsx)("path",Object(f.a)({},c)),Object(b.jsx)("text",{children:Object(b.jsx)("textPath",Object(f.a)(Object(f.a)({},r),{},{children:e.name}))})]})]},e.data[0])}))}),Object(b.jsx)("g",{className:"consume-g",transform:"translate(".concat(400,", ").concat(400,")"),children:X.map((function(e,t){var n=y.find((function(t){return t.data.includes(e.location)})).type,a={className:"consume-item",d:T(e),fill:be(n),fillOpacity:ce(e.price)};return Object(b.jsx)("path",Object(f.a)({},a),JSON.stringify(e))}))}),Object(b.jsx)("g",{className:"first-classify",transform:"translate(".concat(400,", ").concat(400,")"),children:y.map((function(e,t){var a=e.type,c=e.data,r={d:oe(e),fill:be(a),stroke:be(a)},i=y.findIndex((function(e){return e.type===a})),s=Object(l.chain)(y).slice(0,i).map("data").flatten().value().length,u={fill:"none",id:"text-".concat(a),d:je({innerRadius:n[4][0],outerRadius:n[4][1],startAngle:ue(s),endAngle:ue(s+c.length)})},o={href:"#text-".concat(a),startOffset:"50%",dominantBaseline:"middle"},d=W.includes(a)?"active":"";W.length>0&&!W.includes(a)&&(d="disabled");var j=Object(l.intersection)(X.map((function(e){return e.location})),c).length?1:.1;return Object(b.jsxs)("g",{className:d,opacity:j,onClick:function(){var e=F(W,a);_(e);var t=Object(l.chain)(y).filter((function(t){return e.includes(t.type)})).map("data").flatten().value();H(t)},children:[Object(b.jsx)("path",Object(f.a)(Object(f.a)({},r),{},{className:"classify-button"})),Object(b.jsxs)("g",{className:"classify-label",children:[Object(b.jsx)("path",Object(f.a)({},u)),Object(b.jsx)("text",{children:Object(b.jsx)("textPath",Object(f.a)(Object(f.a)({},o),{},{children:e.type}))})]})]},e.type)}))}),Object(b.jsx)("g",{className:"detail-store",transform:"translate(".concat(400,", ").concat(400,")"),children:y.map((function(e,t){var a=e.type,c=e.data,r=Object(l.chain)(y).slice(0,t).map("data").flatten().value().length;return Object(b.jsx)("g",{children:c.map((function(e,t){var c={d:le(e),fill:be(a),stroke:be(a),fillOpacity:ie(re[e])},i={fill:"none",id:"text-".concat(e),d:je({innerRadius:n[3][0],outerRadius:n[3][1],startAngle:ue(r+t),endAngle:ue(r+t+1)})},s={href:"#text-".concat(e),startOffset:"50%",dominantBaseline:"middle"},u=Y.includes(e)?"active":"";Y.length>0&&!Y.includes(e)&&(u="disabled");var o=X.map((function(e){return e.location})).includes(e)?1:.1;return Object(b.jsxs)("g",{opacity:o,className:u,onClick:function(){var t=F(Y,e),n=y.filter((function(e){return e.data.filter((function(e){return t.includes(e)})).length})).map((function(e){return e.type}));H(t),_(n)},children:[Object(b.jsx)("path",Object(f.a)(Object(f.a)({},c),{},{className:"store-button"})),Object(b.jsxs)("g",{className:"store-label",children:[Object(b.jsx)("path",Object(f.a)({},i)),Object(b.jsx)("text",{children:Object(b.jsx)("textPath",Object(f.a)(Object(f.a)({},s),{},{children:e.split(" ").map((function(e,t){return Object(b.jsx)("tspan",{y:10*t,children:e},e)}))}))})]})]},e)}))},"a-".concat(a))}))}),Object(b.jsxs)("g",{className:"customer",transform:"translate(".concat(400,", ").concat(400,")"),children:[Object(b.jsx)("circle",{className:"bg",cx:0,cy:0,r:n[1][0]}),Object(b.jsx)("g",{children:te.map((function(e,t){var a=t*(Math.PI*(3-Math.sqrt(5))),c=Math.sqrt(t)/Math.sqrt(te.length),r=(n[1][0]-10)*(c*Math.cos(a)),i=(n[1][0]-10)*(c*Math.sin(a)),s=ae.includes(e)?1:.1;Q.includes(e);Q.length>0&&Q.includes(e);var u=X.filter((function(t){return t.last4ccnum===e})),o=Object(l.chain)(u).reduce((function(e,t){return e[t.locationType]={value:e[t.locationType]?A(e[t.locationType].value,t.price):Number(t.price),type:t.locationType},e}),{}).values().value(),d=u.reduce((function(e,t){return A(e,t.price)}),0),j=Object(h.b)().domain([0,d]).range([0,2*Math.PI]),O=Object(p.a)().innerRadius(0).outerRadius(5).startAngle((function(e){var t=o.findIndex((function(t){return t.type===e.type})),n=Object(l.chain)(o).slice(0,t).map("value").reduce((function(e,t){return A(e,t)}),0).value();return j(n)})).endAngle((function(e){var t=o.findIndex((function(t){return t.type===e.type})),n=Object(l.chain)(o).slice(0,t).map("value").reduce((function(e,t){return A(e,t)}),0).value()+e.value;return j(n)}));return Object(b.jsxs)("g",{transform:"translate(".concat(r,", ").concat(i,")"),opacity:s,onClick:function(){var t=F(Q,e);V(t)},children:[o.map((function(e){var t={d:O(e),key:"small-".concat(e.type),fill:be(e.type),stroke:be(e.type),fillOpacity:.3};return Object(b.jsx)("path",Object(f.a)({},t))})),Object(b.jsx)("text",{dy:-8,children:e})]})}))})]}),Object(b.jsx)("g",{className:"customerTrack",transform:"translate(".concat(400,", ").concat(400,")"),children:Object.entries(fe).map((function(e){var t=Object(s.a)(e,2),n=t[0],a=t[1],c=Q.includes(n)?1:0;return c&&(c=S?1:0),Object(b.jsx)("g",{opacity:c,children:a.map((function(e){return Object(b.jsx)("path",{d:me(e)},e.toString())}))},n)}))})]})}),Object(b.jsxs)("div",{className:"left",children:[Object(b.jsxs)("div",{className:"condition",children:[Object(b.jsxs)("div",{className:"item",children:["select mode\uff1a",["single","mulitiple"].map((function(e){return Object(b.jsxs)(b.Fragment,{children:[Object(b.jsx)("label",{htmlFor:e,children:e}),Object(b.jsx)("input",{type:"radio",name:"select-mode",checked:I===e,onChange:function(){I!==e&&P(e)},value:e,id:e})]})}))]}),Object(b.jsxs)("div",{className:"item",children:["show customer track\uff1a",Object(b.jsx)("input",{type:"checkbox",name:"track-mode",checked:S,onChange:function(){R(!S)}})]}),Object(b.jsx)("div",{className:"item",children:Object(b.jsx)("button",{onClick:function(){H([]),_([]),V([])},children:"Refresh"})})]}),Object(b.jsx)(M,{data:X,colorScale:be})]})]})}function M(e){var t=e.data,n=void 0===t?[]:t,c=e.colorScale,r=460,i=Object(a.useRef)(null),s=Object(a.useRef)(null);return Object(a.useEffect)((function(){var e=Object(l.chain)(n).map("location").uniq().value(),t=Object(l.chain)(n).map("last4ccnum").uniq().value(),a=(Object(l.chain)(n).map("hour").uniq().value(),{last4ccnum:Object(h.d)().domain(t).range([0,r]),dayStr:Object(h.d)().domain(v.map((function(e){return j()(1e3*e).format("MM/DD/YYYY")}))).range([0,r]),hour:Object(h.b)().domain([0,24]).range([0,r]),location:Object(h.d)().domain(e).range([0,r]),price:Object(h.b)().domain([0,Object(u.d)(n,(function(e){return Number(e.price)}))[1]].reverse()).range([0,r])}),o=Object(h.d)().domain(Object.keys(a)).range([0,500]);Object(h.f)(i.current).selectAll("g.axisx").remove(),Object(h.f)(i.current).selectAll("g.axisx").data(Object.keys(a)).enter().append("g").classed("axisx",!0).attr("transform",(function(e){return"translate(".concat(o(e),", ",0,")")})).each((function(e){var t=Object(h.a)().scale(a[e]);Object(h.f)(this).call(t)}));var d=Object(x.a)();Object(h.f)(s.current).selectAll("path").remove(),Object(h.f)(s.current).selectAll("path").data(n).enter().append("path").attr("d",(function(e){return d(Object.keys(a).map((function(t){return[o(t),a[t](e[t])]})))})).attr("stroke",(function(e){var t=e.location,n=y.find((function(e){return e.data.includes(t)})).type;return c(n)}))}),[n]),Object(b.jsx)("svg",{height:500,width:600,className:"parallel",children:Object(b.jsxs)("g",{transform:"translate(".concat(80,", ").concat(20,")"),children:[Object(b.jsx)("g",{ref:s,className:"path"}),Object(b.jsx)("g",{ref:i})]})})}var S=function(){return Object(b.jsx)("div",{className:"App",children:Object(b.jsx)(k,{})})},R=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,119)).then((function(t){var n=t.getCLS,a=t.getFID,c=t.getFCP,r=t.getLCP,i=t.getTTFB;n(e),a(e),c(e),r(e),i(e)}))};i.a.render(Object(b.jsx)(c.a.StrictMode,{children:Object(b.jsx)(S,{})}),document.getElementById("root")),R()}},[[111,1,2]]]);
//# sourceMappingURL=main.e35daca5.chunk.js.map