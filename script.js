function openTool(tool){
location.href = tool + "/";
}

function searchTools(){

let input = document.getElementById("search").value.toLowerCase();
let cards = document.querySelectorAll(".card");

cards.forEach(card=>{

let name = card.dataset.name;

if(name.includes(input)){
card.style.display="block";
}else{
card.style.display="none";
}

});

}
