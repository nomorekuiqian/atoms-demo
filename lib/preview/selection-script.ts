/** Isolated helper layer; never included in exports or saved snapshots. */
export const selectionScript=String.raw`
  var selecting=false,overlay=null,lastMove=0;
  function endSelection(notify) { selecting=false;if(overlay){overlay.remove();overlay=null;}if(notify)post({type:"selection-exit"}); }
  function highlight(el) {
    if(!el || !el.getBoundingClientRect)return;
    if(!overlay){overlay=document.createElement("div");overlay.setAttribute("data-atoms-selection","");overlay.setAttribute("aria-hidden","true");overlay.style.cssText="position:fixed;pointer-events:none;border:2px solid #5b5bd6;background:rgba(91,91,214,.08);z-index:2147483647;box-sizing:border-box;";document.documentElement.appendChild(overlay);}
    var r=el.getBoundingClientRect();overlay.style.left=r.left+"px";overlay.style.top=r.top+"px";overlay.style.width=r.width+"px";overlay.style.height=r.height+"px";
  }
  function clue(el) { var parts=[],node=el;while(node && node.tagName && parts.length<4){var tag=node.tagName.toLowerCase(),i=1,s=node.previousElementSibling;while(s){if(s.tagName===node.tagName)i++;s=s.previousElementSibling;}parts.unshift(tag+":nth-of-type("+i+")");node=node.parentElement;}return parts.join(" > ").slice(0,300); }
  function safeText(el) {
    // Never read .value, storage, full HTML, attributes, or editable/form-control descendants.
    var text="",walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),node;
    while((node=walker.nextNode()) && text.length<160){var p=node.parentElement;if(!p || p.closest('input,textarea,select,option,script,style,[contenteditable],[hidden],[aria-hidden="true"],[data-atoms-selection]'))continue;if(!p.getClientRects().length || getComputedStyle(p).visibility==="hidden")continue;text+=" "+node.textContent;}
    return text.replace(/\s+/g," ").trim().slice(0,160);
  }
  window.addEventListener("message",function(e){var identity=IDENTITY_PLACEHOLDER;if(e.source!==parent || !e.data || e.data.sessionId!==identity.sessionId || e.data.versionId!==identity.versionId || e.data.type!=="atoms-select" || typeof e.data.enabled!=="boolean")return;if(e.data.enabled){selecting=true;}else endSelection(false);});
  document.addEventListener("pointermove",function(e){if(!selecting || Date.now()-lastMove<40)return;lastMove=Date.now();highlight(e.target);},true);
  ["pointerdown","pointerup","mousedown","mouseup"].forEach(function(type){document.addEventListener(type,function(e){if(selecting)e.stopImmediatePropagation();},true);});
  document.addEventListener("click",function(e){if(!selecting)return;e.preventDefault();e.stopImmediatePropagation();var el=e.target;if(!(el instanceof Element))return;post({type:"element-selected",element:{versionId:VERSION_PLACEHOLDER,tag:el.tagName.toLowerCase(),selector:clue(el),text:safeText(el)}});endSelection(false);},true);
  document.addEventListener("keydown",function(e){if(selecting && e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();endSelection(true);}},true);
`;
