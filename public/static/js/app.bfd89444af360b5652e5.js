webpackJsonp([0],{"+Y6S":function(t,a,e){"use strict";var n=e("IN6T"),r={inserted:function(t){t.focus()}};a.a={name:"draft-card",props:["rowId","colId","numCards"],directives:{focus:r},data:function(){return{label:""}},methods:{onInput:function(t){this.label=t.target.innerText},onCancel:function(t){var a=t.srcElement,e=a.dataset.rowId,r=a.dataset.colId,o={rowId:e,colId:r};n.a.$emit("draft-card-cancel",o)},onSave:function(t){var a={label:this.label,rowId:this.rowId,colId:this.colId,myOrder:this.numCards+1};n.a.$emit("draft-card-save",a)}}}},"3eWl":function(t,a,e){"use strict";var n=function(){var t=this,a=t.$createElement;return(t._self._c||a)("div",{staticClass:"task",attrs:{"data-card-id":t.card.id},on:{click:t.editDetails}},[t._v(t._s(t.card.label))])},r=[],o={render:n,staticRenderFns:r};a.a=o},"5lw2":function(t,a,e){"use strict";function n(t){e("ZZ4r")}var r=e("+Y6S"),o=e("v4ox"),c=e("VU/8"),s=n,i=c(r.a,o.a,!1,s,"data-v-1e9a85a6",null);a.a=i.exports},"84yr":function(t,a){},"8Wsr":function(t,a,e){"use strict";var n=e("DAYN"),r=e.n(n),o=e("rhdv"),c=e("5lw2");a.a={name:"cell",props:["cell","rowId","hasDraftCard"],components:{draggable:r.a,card:o.a,draftCard:c.a},computed:{dragOptions:function(){return{group:"cards",ghostClass:"ghost",disabled:this.contentEditable}}},methods:{onEnd:function(t){console.log("End (drag)"),this.$emit("card-drag-end",{id:t.clone.dataset.cardId,rowId:t.to.dataset.rowId,colId:t.to.dataset.colId,myOrder:t.newIndex+1})},onUpdate:function(){},onChange:function(){},onMove:function(){},onSort:function(){return!0}}}},"8a40":function(t,a,e){"use strict";function n(t){e("KWOH")}var r=e("Sz/U"),o=e("q0ro"),c=e("VU/8"),s=n,i=c(r.a,o.a,!1,s,"data-v-14c37d25",null);a.a=i.exports},"93UE":function(t,a,e){"use strict";function n(t){e("WBDU")}var r=e("mpyD"),o=e("Pzah"),c=e("VU/8"),s=n,i=c(r.a,o.a,!1,s,"data-v-07131804",null);a.a=i.exports},"9bDj":function(t,a,e){"use strict";var n=function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("td",[e("draggable",{staticClass:"dragArea",attrs:{element:"div",list:t.cell.cards,options:t.dragOptions,"data-col-id":t.cell.colId,"data-row-id":t.rowId},on:{end:t.onEnd,update:t.onUpdate,change:t.onChange,sort:t.onSort}},t._l(t.cell.cards,function(t){return e("card",{key:"card.id",attrs:{card:t}})})),t._v(" "),t.hasDraftCard?e("draft-card",{attrs:{rowId:t.rowId,colId:t.cell.colId,numCards:t.cell.cards.length}}):t._e()],1)},r=[],o={render:n,staticRenderFns:r};a.a=o},B1Az:function(t,a,e){"use strict";function n(t){e("wmLG")}var r=e("8Wsr"),o=e("9bDj"),c=e("VU/8"),s=n,i=c(r.a,o.a,!1,s,"data-v-bc45001c",null);a.a=i.exports},E8Ei:function(t,a,e){"use strict";var n=e("IN6T");a.a={name:"masthead",methods:{onClick:function(){n.a.$emit("masthead-add-card",!0)}}}},GYY5:function(t,a,e){"use strict";var n=function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("div",{attrs:{id:"app"}},[e("board")],1)},r=[],o={render:n,staticRenderFns:r};a.a=o},IN6T:function(t,a,e){"use strict";var n=e("7+uW"),r=new n.a;a.a=r},KWOH:function(t,a){},Kz3E:function(t,a,e){"use strict";function n(t){e("Tdpp")}var r=e("E8Ei"),o=e("USWg"),c=e("VU/8"),s=n,i=c(r.a,o.a,!1,s,"data-v-2afa95d7",null);a.a=i.exports},LYzt:function(t,a,e){"use strict";var n=e("7+uW"),r=e("Kz3E"),o=e("93UE"),c=e("8a40"),s=e("IN6T"),i=e("hMcO"),d=e.n(i);n.a.use(d.a,"https://zenbrd.heroku.com"),a.a={name:"board",components:{masthead:r.a,row:o.a,cardEditor:c.a},data:function(){return{rows:[]}},sockets:{connect:function(){console.log("socket connected")},customEmit:function(t){console.log('this method was fired by the socket server. eg: io.emit("customEmit", data)')},boardRefresh:function(t){console.log("boardRefresh",t),this.rows=t}},watch:{rows:function(t){console.log(t)}},created:function(){var t=this;fetch("https://zenbrd.heroku.com/api/rows/deep").then(function(a){a.json().then(function(a){t.rows=a})}).catch(function(t){console.error(t),alert("Sorry, something went wrong\n\n"+t)})},methods:{cardDragEnd:function(t){console.log("board:card-drag-end",t),this.$socket.emit("task:move",t)},onCancel:function(t){console.log("board:onCancel"),s.a.$emit("global-cancel",!0)},onSave:function(t){console.log("board:onSave"),s.a.$emit("global-save",!0)}},mounted:function(){var t=this;s.a.$on("rows-refreshed",function(a){console.log("board:rows-refreshed"),t.rows=a}),s.a.$on("draft-card-save",function(t){console.log("draft-card-save",t),this.$socket.emit("task:create",t)})}}},M93x:function(t,a,e){"use strict";function n(t){e("lBIa")}var r=e("xJD8"),o=e("GYY5"),c=e("VU/8"),s=n,i=c(r.a,o.a,!1,s,null,null);a.a=i.exports},NHnr:function(t,a,e){"use strict";Object.defineProperty(a,"__esModule",{value:!0});var n=e("7+uW"),r=e("M93x");n.a.config.productionTip=!1,new n.a({el:"#app",template:"<App/>",components:{App:r.a}})},NU23:function(t,a,e){"use strict";var n=e("IN6T");a.a={name:"card",props:["card"],methods:{editDetails:function(){console.log("editDetails"),n.a.$emit("card-edit-details",this.card.id)}}}},Pzah:function(t,a,e){"use strict";var n=function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("tr",{staticClass:"plain-bg",on:{mouseover:function(a){t.hover=!0},mouseleave:function(a){t.hover=!1}}},[e("th",[e("div",{staticClass:"row-label"},[t._v(t._s(t.row.label))]),t._v(" "),e("transition",{attrs:{name:"fade"}},[t.hover?e("div",{staticClass:"btn-task-new",attrs:{disabled:"hasDraftCard"},on:{click:t.addDraftCard}},[t._v("Add card")]):t._e()])],1),t._v(" "),t._l(t.row.cells,function(a,n){return e("cell",{key:t.row.id+","+n,attrs:{cell:a,rowId:t.row.id,hasDraftCard:t.hasDraftCard&&1===a.colId},on:{"card-drag-end":t.cardDragEnd}})})],2)},r=[],o={render:n,staticRenderFns:r};a.a=o},"Sz/U":function(t,a,e){"use strict";var n=e("mvHQ"),r=e.n(n),o=e("IN6T"),c={inserted:function(t){t.focus()}};a.a={name:"cardEditor",directives:{focus:c},data:function(){return{card:!1}},mounted:function(){var t=this;o.a.$on("card-edit-details",function(a){console.log("Edit card",a),fetch("https://zenbrd.heroku.com/api/cards/"+a).then(function(a){a.json().then(function(a){t.card=a})}).catch(function(t){console.error(t),alert("Sorry, something went wrong\n\n"+t)})}),o.a.$on("global-cancel",function(){t.onCancel()}),o.a.$on("global-save",function(){t.onSave()})},methods:{onCancel:function(){this.card=!1},onCancelIfClickOutside:function(t){t.srcElement.classList.contains("template-modal")&&o.a.$emit("global-cancel",t)},onSave:function(){console.log("About to save card..."),this.card.timestamp=(new Date).getTime();var t=this;console.log("api url","https://zenbrd.heroku.com"),fetch("https://zenbrd.heroku.com/api/cards/save",{method:"post",headers:new Headers({"Content-Type":"application/json"}),body:r()(this.card)}).then(function(a){if(!a.ok)throw Error(a.statusText);console.log("Card saved"),t.card=!1}).catch(function(t){return alert("Sorry, something went wrong\n\n"+t)})},handleCmdEnter:function(t){console.log(t),(t.metaKey||t.ctrlKey)&&13===t.keyCode&&this.onSave()}}}},TUcH:function(t,a,e){"use strict";function n(t){e("m2uj")}var r=e("LYzt"),o=e("uJeE"),c=e("VU/8"),s=n,i=c(r.a,o.a,!1,s,"data-v-fc1e6124",null);a.a=i.exports},Tdpp:function(t,a){},USWg:function(t,a,e){"use strict";var n=function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("div",{staticClass:"masthead"},[e("div",{staticClass:"heading"},[t._v("\n        Acme Dev Team\n    ")]),t._v(" "),e("div",{staticClass:"nav"},[e("span",{staticClass:"nav-item nav-task-new action-task-new",on:{click:t.onClick}},[t._v("+ Add card")])])])},r=[],o={render:n,staticRenderFns:r};a.a=o},WBDU:function(t,a){},ZZ4r:function(t,a){},lBIa:function(t,a){},m2uj:function(t,a){},mpyD:function(t,a,e){"use strict";var n=e("B1Az"),r=e("IN6T");a.a={name:"row",components:{cell:n.a},props:["row"],data:function(){return{hasDraftCard:!1,hover:!1}},methods:{cardDragEnd:function(t){this.$emit("card-drag-end",t)},addDraftCard:function(t){this.hasDraftCard=!0},removeDraftCards:function(t){this.hasDraftCard=!1}},mounted:function(){var t=this;r.a.$on("draft-card-cancel",function(a){a.rowId===t.row.id.toString()&&t.removeDraftCards(a)}),r.a.$on("draft-card-save",function(a){a.rowId===t.row.id&&(t.hasDraftCard=!1)}),r.a.$on("masthead-add-card",function(){console.log("masthead-add-card"),1===t.row.position&&(t.hasDraftCard=!0)})}}},q0ro:function(t,a,e){"use strict";var n=function(){var t=this,a=t.$createElement,e=t._self._c||a;return t.card?e("div",{staticClass:"template-task-details template-modal",on:{click:t.onCancelIfClickOutside}},[e("div",{staticClass:"task-details-content modal-content",on:{keyup:[function(a){return("button"in a||!t._k(a.keyCode,"enter",13,a.key))&&a.ctrlKey?void t.onSave(a):null},function(a){if(!("button"in a)&&t._k(a.keyCode,"esc",27,a.key))return null;t.onCancel(a)}]}},[e("div",[e("input",{directives:[{name:"model",rawName:"v-model",value:t.card.label,expression:"card.label"},{name:"focus",rawName:"v-focus"}],staticClass:"tdc-label form-label",attrs:{type:"text",name:"label"},domProps:{value:t.card.label},on:{input:function(a){a.target.composing||t.$set(t.card,"label",a.target.value)}}})]),t._v(" "),e("div",[e("textarea",{directives:[{name:"model",rawName:"v-model",value:t.card.description,expression:"card.description"}],staticClass:"tdc-description form-textarea",attrs:{name:"description"},domProps:{value:t.card.description},on:{input:function(a){a.target.composing||t.$set(t.card,"description",a.target.value)}}})]),t._v(" "),e("div",{staticClass:"tdc-archive form-archive"},[t._v("Archive "),e("input",{directives:[{name:"model",rawName:"v-model",value:t.card.isArchived,expression:"card.isArchived"}],staticClass:"tdc-archive form-archive",attrs:{type:"checkbox",name:"archive"},domProps:{checked:Array.isArray(t.card.isArchived)?t._i(t.card.isArchived,null)>-1:t.card.isArchived},on:{change:function(a){var e=t.card.isArchived,n=a.target,r=!!n.checked;if(Array.isArray(e)){var o=t._i(e,null);n.checked?o<0&&(t.card.isArchived=e.concat([null])):o>-1&&(t.card.isArchived=e.slice(0,o).concat(e.slice(o+1)))}else t.$set(t.card,"isArchived",r)}}})]),t._v(" "),e("div",{staticClass:"modal-buttons tdc-buttons"},[e("input",{staticClass:"modal-cancel tdc-button-cancel",attrs:{type:"button",value:"Cancel",title:"[Esc]"},on:{click:t.onCancel}}),t._v(" "),e("input",{staticClass:"modal-save tdc-button-save",attrs:{type:"button",value:"Save",title:"[CMD + Enter]"},on:{click:t.onSave}})])])]):t._e()},r=[],o={render:n,staticRenderFns:r};a.a=o},rhdv:function(t,a,e){"use strict";function n(t){e("84yr")}var r=e("NU23"),o=e("3eWl"),c=e("VU/8"),s=n,i=c(r.a,o.a,!1,s,"data-v-3fc4922c",null);a.a=i.exports},uJeE:function(t,a,e){"use strict";var n=function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("div",[e("masthead"),t._v(" "),e("table",{staticClass:"main",on:{keyup:[function(a){return("button"in a||!t._k(a.keyCode,"enter",13,a.key))&&a.ctrlKey?void t.onSave(a):null},function(a){if(!("button"in a)&&t._k(a.keyCode,"esc",27,a.key))return null;t.onCancel(a)}]}},[t._m(0),t._v(" "),t._l(t.rows,function(a){return e("row",{key:"row.id",attrs:{row:a},on:{"card-drag-end":t.cardDragEnd}})})],2),t._v(" "),e("cardEditor")],1)},r=[function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("tr",[e("td",{staticClass:"cell-0"}),t._v(" "),e("th",{staticClass:"col"},[t._v("To do\n      ")]),t._v(" "),e("th",{staticClass:"col"},[t._v("Blocked\n      ")]),t._v(" "),e("th",{staticClass:"col"},[t._v("In progress\n      ")]),t._v(" "),e("th",{staticClass:"col"},[t._v("Done\n      ")])])}],o={render:n,staticRenderFns:r};a.a=o},v4ox:function(t,a,e){"use strict";var n=function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("div",{staticClass:"draft-card-wrapper"},[e("div",{directives:[{name:"focus",rawName:"v-focus"}],staticClass:"task-new",attrs:{contenteditable:!0},on:{input:t.onInput}}),t._v(" "),e("div",{staticClass:"button-container"},[e("span",{staticClass:"button btn-cancel",attrs:{title:"[Esc]","data-row-id":t.rowId,"data-col-id":t.colId},on:{click:t.onCancel}},[t._v("Cancel")]),t._v(" "),e("span",{staticClass:"button btn-save",attrs:{title:"[CTRL + Enter]"},on:{click:t.onSave}},[t._v("Save")])])])},r=[],o={render:n,staticRenderFns:r};a.a=o},wmLG:function(t,a){},xJD8:function(t,a,e){"use strict";var n=e("TUcH");a.a={name:"app",components:{board:n.a}}}},["NHnr"]);
//# sourceMappingURL=app.bfd89444af360b5652e5.js.map