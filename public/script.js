let games=[];
const container=document.getElementById("gamesContainer");
const search=document.getElementById("search");
const filter=document.getElementById("filter");
const modal=document.getElementById("modal");
const closeModal=document.getElementById("closeModal");
const modalImage=document.getElementById("modalImage");
const modalTitle=document.getElementById("modalTitle");
const modalType=document.getElementById("modalType");
const modalFile=document.getElementById("modalFile");
const downloadButton=document.getElementById("downloadButton");

async function loadGames(){
    try{
        const response=await fetch("/api/games");
        if(!response.ok) throw new Error("API ERROR");
        games=await response.json();
        renderGames();
    }catch(error){
        console.error(error);
        container.innerHTML='<div class="loading">❌ ERROR LOADING GAMES<br><br>Check the server.</div>';
    }
}

function renderGames(){
    const searchText=search.value.toLowerCase().trim();
    const selectedFilter=filter.value;
    container.innerHTML="";
    const filtered=games.filter(game=>{
        const searchMatch=game.title.toLowerCase().includes(searchText);
        const filterMatch=selectedFilter==="all"||game.type===selectedFilter;
        return searchMatch&&filterMatch;
    });
    if(filtered.length===0){
        container.innerHTML='<div class="loading">🎮<br><br>NO GAMES FOUND</div>';
        return;
    }
    filtered.forEach(createGameCard);
}

function createGameCard(game){
    const card=document.createElement("article");
    card.className="game-card";
    const image=game.cover||createPlaceholder(game.title);
    card.innerHTML=`
        <img class="game-cover" src="${image}" alt="${escapeHTML(game.title)}">
        <div class="game-info">
            <div class="game-type">${game.type}</div>
            <h3>${escapeHTML(game.title)}</h3>
            <p>${game.file?escapeHTML(game.file):"NO DOWNLOAD FILE"}</p>
        </div>`;
    const cardImage=card.querySelector(".game-cover");
    cardImage.addEventListener("error",()=>cardImage.src=createPlaceholder(game.title));
    card.addEventListener("click",()=>openGame(game));
    container.appendChild(card);
}

function openGame(game){
    modalTitle.textContent=game.title;
    modalType.textContent=game.type;
    modalFile.textContent=game.file?"File: "+game.file:"No downloadable file";
    modalImage.src=game.cover||createPlaceholder(game.title);
    modalImage.onerror=()=>modalImage.src=createPlaceholder(game.title);
    if(game.download){
        downloadButton.href=game.download;
        downloadButton.style.display="block";
    }else{
        downloadButton.style.display="none";
    }
    modal.classList.add("active");
    document.body.style.overflow="hidden";
}

function closeGame(){
    modal.classList.remove("active");
    document.body.style.overflow="";
}

closeModal.addEventListener("click",closeGame);
modal.addEventListener("click",event=>{if(event.target===modal)closeGame()});
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeGame()});
search.addEventListener("input",renderGames);
filter.addEventListener("change",renderGames);

function escapeHTML(text){
    return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function createPlaceholder(title){
    const safe=String(title).replace(/[<>&'"]/g,"");
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#071009"/><text x="400" y="225" text-anchor="middle" dominant-baseline="middle" fill="#00ff66" font-size="42" font-family="monospace">${safe}</text></svg>`;
    return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(svg);
}

loadGames();