let $$ = selector => document.querySelector(selector);
let $$All = selector => document.querySelectorAll(selector);

let search = e =>
{
    let query = $$("#search input[type='text']").value.trim().toLowerCase();
    let cancel = false;

    if (!cancel)
        if (e.type === "keypress")
            if (e.keyCode !== 13)
                cancel = true;

    if (query.length === 0)
    {
        clearResults();
        cancel = true;
    }
    if (!cancel)
    {
        let favourites = getFavourites();

        clearResults();
        $$("#delayMsg").classList.remove("hide");
        fetch(`https://secure.toronto.ca/cc_sr_v1/data/swm_waste_wizard_APR?limit=1000`)
        .then(data => data.json())
        .then(data =>
        {
            for (let entry of data)
            {
                let isFavourite = favourites.includes(entry.title);
                let matchesKeywords = entry.keywords.split(",").some(keyword =>
                    {
                        let matches = false;
                        keyword = keyword.trim().toLowerCase();
                        if (keyword.length > 0)
                            matches = keyword.includes(query) || query.includes(keyword);
                        return matches;
                    });

                if (matchesKeywords || isFavourite)
                {
                    //Decode html encoded entities
                    let decoderTextarea = document.createElement("textarea");
                    decoderTextarea.innerHTML = entry.body;
                    entry.body = decoderTextarea.value;

                    let entryHTML = `
                    <li class="entry ${isFavourite?"favourite":""}" data-id="${entry.id===undefined?"":entry.id}" data-title="${entry.title}">
                        <i class="fa-li fa fa-star faveStar"></i>
                        <div class="title"><span>${entry.title}</span></div>
                        <div class="description">${entry.body}</div>
                    </li>`;

                    if (matchesKeywords)
                        $$("#results #all").insertAdjacentHTML("beforeend", entryHTML);
                    if (isFavourite) 
                        $$("#results #favourites ul").insertAdjacentHTML("beforeend", entryHTML);
                }
            }
            $$("#delayMsg").classList.add("hide");

            if ($$All("#results #favourites .entry").length > 0)
            {
                $$("#results #favourites").classList.remove("hide");
            }
        })
        .catch(err =>
        {
            console.log(err);
            $$("#errorMsg").classList.remove("hide");
            $$("#errorMsg").innerHTML = "Sorry! We could not retrieve any data. Please try again later.";
        });
    }
};

let clearResults = e =>
{
    $$("#results #all").innerHTML = "";
    $$("#results #favourites ul").innerHTML = "";
    $$("#results #favourites").classList.add("hide");
}

let addFavourite = title =>
{
    let favourites = getFavourites();
    favourites.push(title); //I would have done it by id, but many of the entries lacked them.
    saveFavourites(favourites);
}
let removeFavourite = title =>
{
    let favourites = getFavourites();
    favourites.splice(favourites.indexOf(title), 1);
    saveFavourites(favourites);
}
let getFavourites = () =>
{
    if (localStorage.getItem("favourites") === null)
        localStorage.setItem("favourites", "");

    let favourites = localStorage.getItem("favourites").split("&;");
    if (favourites[0] === "")
        favourites.shift();
    return favourites;
}
let saveFavourites = favourites =>
{
    localStorage.setItem("favourites", favourites.join("&;"));
}

let toggleFavourite = e =>
{
    let el = e.target
    if (el.tagName === "SPAN")
        if (el.parentNode.classList.contains("title"))
            el = el.parentNode.previousElementSibling;

    if (el.classList.contains("faveStar"))
    {
        let title = el.parentNode.dataset.title;
        if (el.parentNode.classList.contains("favourite"))
        {
            removeFavourite(title);
            //Selecting element instead of using el because the user may unfavourite from the favourites list
            if ($$(`#all .entry[data-title='${title}']`) !== null) //In case user's search does not include the favourite
                $$(`#all .entry[data-title='${title}']`).classList.remove("favourite");
            $$("#favourites ul").removeChild($$(`#favourites .entry[data-title='${title}']`));
            if ($$All("#favourites ul .entry").length === 0)
                $$("#favourites").classList.add("hide");    
        }
        else
        {
            addFavourite(title);
            el.parentNode.classList.add("favourite");
            $$("#favourites ul").insertAdjacentHTML("beforeend", $$(`#all .entry[data-title='${title}']`).outerHTML);
            $$("#favourites").classList.remove("hide");
        }
    }
};

$$("#search button").addEventListener("click", search);
$$("#search input[type='text']").addEventListener("keypress", search);
$$("#results").addEventListener("click", toggleFavourite);