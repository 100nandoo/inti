import{H as a,I as o}from"./index.js";function n(){return a()}function c(e,{immediate:s=!0}={}){let r=!0;return o.subscribe(t=>{if(!s&&r){r=!1;return}r=!1,e(t)})}export{n as g,c as s};
