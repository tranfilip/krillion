// Režim „Vyšší, nebo nižší?“
// V = veličiny: klíč → [otázka, jednotka]. Porovnávají se jen položky STEJNÉ veličiny (stejná jednotka),
//     takže páry se skládají automaticky (i napříč kategoriemi: „Bajkal, nebo Belgie?“).
// G = skupiny položek: {v: veličina, c: kategorie, s: zdroj/poznámka, a: 1 = přibližné hodnoty (ukáže se „~“),
//     min: nejmenší poměr hodnot, při kterém se pár smí zeptat (vždy aspoň 1,05 = rozdíl 5 %; u odhadů víc),
//     y: 1 = hodnota je rok vzniku (hra porovnává stáří), i: [[název, hodnota, poznámka?], ...]}
// Do dat patří jen hodnoty, které jsou fakticky ověřitelné; nejisté položky raději vůbec.
window.KRILLION_HL={
V:{
 obyv:["Co má víc obyvatel?","obyvatel"],
 rozloha:["Co má větší rozlohu?","km²"],
 hora:["Která hora je vyšší?","m n. m."],
 vyska:["Co je vyšší?","m"],
 reka:["Která řeka je delší?","km"],
 hmot:["Co váží víc?","kg"],
 rychlost:["Co je rychlejší?","km/h"],
 vek:["Kdo se dožil vyššího věku?","let"],
 kcal:["Co má víc kalorií na 100 g?","kcal"],
 sirka:["Co je širší?","km"],
 slunce:["Co je dál od Slunce?","mil. km"],
 obeh:["Co oběhne Slunce za delší dobu?","dní"],
 hloubka:["Co je hlubší?","m"],
 divoci:["Kterých zvířat žije ve volné přírodě víc?","jedinců"],
 sloni:["Ve které zemi žije víc divokých slonů?","slonů"],
 nhl:["Kdo dal v NHL víc gólů?","gólů"],
 gs:["Kdo vyhrál víc grandslamů ve dvouhře?","titulů"],
 trzby:["Který film vydělal v kinech víc?","USD"],
 prestup:["Který přestup byl dražší?","€"],
 voda:["Co má větší vodní stopu na 1 kg?","l vody"],
 kofein:["Co má víc kofeinu?","mg"],
 stari:["Co je starší?","let"],
 hvezdy:["Co je dál od Země?","světelných let"],
 delka:["Co je delší?","m"],
 pocet:["Čeho je víc?",""]
},
G:[
// ---------- obyvatelé ----------
{v:"obyv",c:"Česko",s:"ČSÚ, 2024 (zaokrouhleno)",a:1,min:1.1,i:[
 ["Praha",1384000],["Brno",402000],["Ostrava",283000],["Plzeň",185000],["Liberec",104000],["Olomouc",101000],
 ["České Budějovice",97000],["Hradec Králové",93000],["Pardubice",92000],["Ústí nad Labem",91000],["Zlín",74000],
 ["Havířov",69000],["Kladno",69000],["Most",63000],["Opava",55000],["Jihlava",54000],["Frýdek-Místek",54000],
 ["Karviná",50000],["Teplice",49000],["Děčín",47000],["Karlovy Vary",46000],["Chomutov",46000],
 ["Jablonec nad Nisou",45000],["Mladá Boleslav",45000],["Prostějov",43000],["Přerov",41000],["Česká Lípa",36000],
 ["Třebíč",34000],["Tábor",34000],["Znojmo",34000],["Kolín",33000],["Příbram",32000],["Cheb",31000],
 ["Písek",30000],["Trutnov",30000],["Kroměříž",28000],["Šumperk",25000],["Uherské Hradiště",25000],
 ["Kutná Hora",21000],["Český Krumlov",13000],["Mikulov",7400],["Telč",5200]]},
{v:"obyv",c:"Česko",s:"kraje ČR, ČSÚ 2024 (zaokrouhleno)",a:1,min:1.1,i:[
 ["Středočeský kraj",1455000],["Jihomoravský kraj",1227000],["Moravskoslezský kraj",1177000],["Ústecký kraj",800000],
 ["Jihočeský kraj",650000],["Olomoucký kraj",630000],["Plzeňský kraj",600000],["Zlínský kraj",580000],
 ["Královéhradecký kraj",555000],["Pardubický kraj",527000],["Kraj Vysočina",513000],["Liberecký kraj",448000],
 ["Karlovarský kraj",294000]]},
{v:"obyv",c:"Svět",s:"OSN a národní statistiky, 2024 (zaokrouhleno)",a:1,min:1.12,i:[
 ["Indie",1450000000],["Čína",1410000000],["USA",340000000],["Indonésie",280000000],["Pákistán",245000000],
 ["Nigérie",230000000],["Brazílie",212000000],["Bangladéš",172000000],["Rusko",145000000],["Mexiko",130000000],
 ["Japonsko",124000000],["Etiopie",130000000],["Filipíny",115000000],["Egypt",115000000],["Vietnam",100000000],
 ["Írán",90000000],["Turecko",86000000],["Německo",84000000],["Thajsko",71000000],["Spojené království",68000000],
 ["Francie",68000000],["Jihoafrická republika",63000000],["Itálie",59000000],["Keňa",55000000],["Jižní Korea",51700000],
 ["Kolumbie",52000000],["Španělsko",48500000],["Argentina",46000000],["Kanada",41000000],["Polsko",37500000],
 ["Maroko",37000000],["Saúdská Arábie",35000000],["Peru",34000000],["Austrálie",27000000],["Chile",20000000],
 ["Nizozemsko",18000000],["Belgie",11800000],["Česko",10900000],["Švédsko",10600000],["Portugalsko",10600000],
 ["Řecko",10400000],["Maďarsko",9600000],["Rakousko",9200000],["Švýcarsko",9000000],["Dánsko",6000000],
 ["Finsko",5600000],["Norsko",5600000],["Slovensko",5400000],["Irsko",5300000],["Nový Zéland",5300000],
 ["Chorvatsko",3850000],["Mongolsko",3500000],["Litva",2900000],["Slovinsko",2120000],["Lotyšsko",1870000],
 ["Estonsko",1370000],["Lucembursko",670000],["Malta",560000],["Island",390000],["Grónsko",56000],
 ["Lichtenštejnsko",40000],["Monako",38000],["San Marino",34000]]},
{v:"obyv",c:"Svět",s:"město v administrativních hranicích, 2023–2024 (zaokrouhleno)",a:1,min:1.12,i:[
 ["Londýn (Velký Londýn)",8900000],["New York",8300000],["Los Angeles",3800000],["Berlín",3750000],["Madrid",3400000],
 ["Řím",2750000],["Paříž",2100000],["Vídeň",2000000],["Hamburk",1900000],["Varšava",1860000],["Budapešť",1700000],
 ["Mnichov",1500000],["Amsterdam",930000],["Kodaň",660000],["Lisabon",550000],["Bratislava",475000]]},
// ---------- rozloha ----------
{v:"rozloha",c:"Svět",s:"rozloha státu",min:1.05,i:[
 ["Rusko",17098246],["Kanada",9984670],["USA",9833517],["Čína",9596961],["Brazílie",8515767],["Austrálie",7692024],
 ["Indie",3287263],["Argentina",2780400],["Kazachstán",2724900],["Alžírsko",2381741],["DR Kongo",2344858],
 ["Saúdská Arábie",2149690],["Mexiko",1964375],["Indonésie",1904569],["Súdán",1886068],["Libye",1759540],
 ["Írán",1648195],["Mongolsko",1564110],["Peru",1285216],["Čad",1284000],["Jihoafrická republika",1221037],
 ["Kolumbie",1141748],["Egypt",1001450],["Nigérie",923768],["Turecko",783562],["Chile",756102],["Ukrajina",603550],
 ["Keňa",580367],["Francie (evropská část)",551695],["Thajsko",513120],["Španělsko",505990],["Švédsko",450295],
 ["Japonsko",377975],["Německo",357588],["Finsko",338455],["Vietnam",331212],["Polsko",312696],["Itálie",302073],
 ["Nový Zéland",268021],["Spojené království",242495],["Rumunsko",238397],["Řecko",131957],["Bulharsko",110994],
 ["Island",103000],["Maďarsko",93030],["Portugalsko",92212],["Rakousko",83879],["Česko",78871],["Irsko",70273],
 ["Litva",65300],["Lotyšsko",64589],["Chorvatsko",56594],["Slovensko",49035],["Estonsko",45339],
 ["Dánsko (bez Grónska)",42933],["Nizozemsko",41850],["Švýcarsko",41285],["Belgie",30689],["Slovinsko",20271],
 ["Kypr",9251],["Lucembursko",2586],["Singapur",735],["Malta",316],["Lichtenštejnsko",160],["San Marino",61],
 ["Monako",2.02],["Vatikán",0.49]]},
{v:"rozloha",c:"Příroda",s:"rozloha ostrova",min:1.05,i:[
 ["Grónsko",2166086],["Nová Guinea",785753],["Borneo",748168],["Madagaskar",587041],["Baffinův ostrov",507451],
 ["Sumatra",443066],["Honšú",227960],["Velká Británie (ostrov)",209331],["Sulawesi",180681],
 ["Jižní ostrov (Nový Zéland)",150437],["Irsko (celý ostrov)",84421],["Tasmánie",68401],["Srí Lanka",65610],
 ["Sicílie",25711],["Sardinie",24090],["Havaj (Velký ostrov)",10432],["Korsika",8680],["Kréta",8336],
 ["Bali",5780],["Mallorca",3640],["Tenerife",2034],["Rujána",926],["Manhattan",59.1]]},
{v:"rozloha",c:"Příroda",s:"plocha jezera (kolísá s hladinou)",a:1,min:1.1,i:[
 ["Kaspické moře",371000],["Hořejší jezero",82100],["Viktoriino jezero",68870],["Huronské jezero",59600],
 ["Michiganské jezero",58000],["Tanganika",32600],["Bajkal",31500],["Velké Medvědí jezero",31080],["Malawi",29600],
 ["Ladožské jezero",17700],["Titicaca",8372],["Balaton",592],["Ženevské jezero",580],["Bodamské jezero",536],
 ["Lago di Garda",370],["Loch Ness",56],["Lipno",48.7]]},
{v:"rozloha",c:"Svět",s:"rozloha kontinentu (podle běžného dělení)",a:1,min:1.1,i:[
 ["Asie",44579000],["Afrika",30370000],["Severní Amerika",24709000],["Jižní Amerika",17840000],
 ["Antarktida",14200000],["Evropa",10180000]]},
{v:"rozloha",c:"Příroda",s:"rozloha pouště (hranice nejsou ostré)",a:1,min:1.2,i:[
 ["Sahara",9200000],["Arabská poušť",2330000],["Gobi",1295000]]},
{v:"rozloha",c:"Česko",s:"rozloha kraje, ČSÚ",min:1.05,i:[
 ["Středočeský kraj",10929],["Jihočeský kraj",10058],["Plzeňský kraj",7649],["Jihomoravský kraj",7188],
 ["Kraj Vysočina",6796],["Moravskoslezský kraj",5427],["Ústecký kraj",5335],["Olomoucký kraj",5272],
 ["Královéhradecký kraj",4759],["Pardubický kraj",4519],["Zlínský kraj",3963],["Karlovarský kraj",3310],
 ["Liberecký kraj",3163],["Praha",496]]},
{v:"rozloha",c:"Svět",s:"rozloha města v jeho hranicích",min:1.05,i:[
 ["Londýn (Velký Londýn)",1572],["Řím",1285],["Berlín",891],["Budapešť",525],["Vídeň",415],["Bratislava",368],
 ["Brno",230],["Ostrava",214],["Plzeň",138],["Paříž",105]]},
// ---------- výšky ----------
{v:"hora",c:"Hory",s:"nadmořská výška vrcholu",min:1.05,i:[
 ["Mount Everest",8849],["K2",8611],["Kančendženga",8586],["Lhoce",8516],["Makalu",8485],["Čo Oju",8188],
 ["Dhaulágirí",8167],["Manáslu",8163],["Nanga Parbat",8126],["Annapurna",8091],["Aconcagua",6961],["Denali",6190],
 ["Kilimandžáro",5895],["Elbrus",5642],["Ararat",5137],["Mount Vinson",4892],["Puncak Jaya",4884],
 ["Mont Blanc",4806],["Matterhorn",4478],["Mauna Kea",4207],["Grossglockner",3798],["Fudži",3776],["Teide",3715],
 ["Zugspitze",2962],["Musala",2925],["Olymp",2918],["Triglav",2864],["Gerlachovský štít",2655],
 ["Lomnický štít",2634],["Rysy",2501],["Kriváň",2494],["Kosciuszko",2228],["Ben Nevis",1345],["Vesuv",1281]]},
{v:"hora",c:"Česko",s:"nadmořská výška vrcholu",min:1.05,i:[
 ["Sněžka",1603],["Luční hora",1555],["Studniční hora",1554],["Praděd",1491],["Králický Sněžník",1424],
 ["Keprník",1423],["Plechý",1378],["Boubín",1362],["Lysá hora",1323],["Klínovec",1244],["Radhošť",1129],
 ["Smrk",1124],["Velká Deštná",1116],["Kleť",1084],["Ještěd",1012],["Milešovka",837],["Velký Blaník",638],
 ["Říp",456],["Petřín",327]]},
{v:"vyska",c:"Stavby",s:"výška stavby (u mrakodrapů architektonická výška)",min:1.05,i:[
 ["Burdž Chalífa",828],["Merdeka 118",679],["Tokyo Skytree",634],["Shanghai Tower",632],["Abraj Al-Bait",601],
 ["Ping An Finance Center",599],["Lotte World Tower",555],["CN Tower",553],["One World Trade Center",541],
 ["Taipei 101",508],["Petronas Towers",452],["Willis Tower",442],["Empire State Building",381,"bez antény (s anténou 443 m)"],
 ["Millau (nejvyšší pilíř)",343],["Eiffelova věž",330],["The Shard",310],["Golden Gate (pylon)",227],
 ["Žižkovská věž",216],["Gateway Arch",192],["Socha jednoty",182],["Ulmský chrám",161.5],["Kolínský dóm",157],
 ["Velká pyramida v Gíze (dnes)",138.5],["AZ Tower Brno",111],["Katedrála sv. Víta (hlavní věž)",96.5],
 ["Big Ben (Elizabeth Tower)",96],["Ještěd (hotel a vysílač)",94],["Socha Svobody (s podstavcem)",93],
 ["Petřínská rozhledna",63.5],["Šikmá věž v Pise",56],["Socha Krista Spasitele (s podstavcem)",38]]},
{v:"vyska",c:"Příroda",s:"výška (stromy a zvířata přibližně)",a:1,min:1.08,i:[
 ["Salto Angel (vodopád)",979],["Hyperion (nejvyšší strom)",116],["Niagarské vodopády (Podkova)",51],
 ["Dospělá žirafa (samec)",5.5]]},
{v:"reka",c:"Příroda",s:"délka toku (zdroje se liší podle měření)",a:1,min:1.1,i:[
 ["Nil",6650],["Amazonka",6400],["Jang-c’-ťiang",6300],["Mississippi s Missouri",6275],["Jenisej",5539],
 ["Žlutá řeka",5464],["Ob s Irtyšem",5410],["Paraná",4880],["Kongo",4700],["Amur",4444],["Lena",4400],
 ["Mekong",4350],["Niger",4180],["Volha",3531],["Indus",3180],["Dunaj",2850],["Eufrat",2800],["Ganga",2525],
 ["Ural",2428],["Colorado",2330],["Dněpr",2201],["Don",1870],["Tigris",1850],["Rýn",1233],["Labe",1094],
 ["Visla",1047],["Loira",1006],["Odra",854],["Rhôna",812],["Seina",777],["Pád",652],["Vltava",430],["Tibera",406],
 ["Morava",354],["Temže",346],["Dyje",306],["Ohře",300],["Sázava",225],["Jizera",164],["Berounka",139]]},
// ---------- hmotnost ----------
{v:"hmot",c:"Zvířata",s:"typický dospělý jedinec (hmotnost se hodně liší)",a:1,min:1.5,i:[
 ["Plejtvák obrovský",150000],["10 slonů afrických",60000],["Vorvaň (samec)",40000],["Keporkak",30000],
 ["Kosatka (samec)",6000],["Slon africký (samec)",6000],["Slon indický (samec)",4000],["Nosorožec bílý",2300],
 ["Hroch",1500],["Žirafa (samec)",1200],["Bizon",900],["Kráva",700],["Kůň",500],["Lední medvěd (samec)",450],
 ["Zebra",350],["Medvěd hnědý (samec)",250],["Tygr (samec)",200],["Lev (samec)",190],["Gorila (samec)",160],
 ["Pštros",110],["Panda velká",100],["Klokan rudý (samec)",85],["Komodský varan",80],["Člověk (průměr)",70],
 ["Šimpanz",50],["Vlk",40],["Labrador",32],["Bobr",20],["Liška",6],["Kočka",4.5],["Slepice",2.5],["Ježek",0.8],
 ["Potkan",0.35],["Myš domácí",0.02],["Kolibřík",0.003],["Včela medonosná",0.0001]]},
{v:"hmot",c:"Technika",s:"hmotnost (přibližně)",a:1,min:1.15,i:[
 ["Velká pyramida v Gíze",6000000000],["Titanic (výtlak)",52000000],["Eiffelova věž",10100000],
 ["Saturn V (při startu)",2950000],["Mezinárodní vesmírná stanice",420000],["Airbus A380 (prázdný)",277000],
 ["Socha Svobody",225000],["Car-kolokol (zvon v Kremlu)",200000],["Boeing 747 (prázdný)",180000],
 ["Tank Leopard 2",60000],["Škoda Octavia",1300],["Formule 1 i s jezdcem",800],["Fotbalový míč",0.43],
 ["iPhone 15",0.171],["Hokejový puk",0.165],["Tenisový míček",0.058],["Golfový míček",0.0459],
 ["Mince 50 Kč",0.0097],["Mince 1 €",0.0075],["Mince 1 Kč",0.0036]]},
// ---------- rychlost ----------
{v:"rychlost",c:"Zvířata",s:"nejvyšší rychlost (přibližně)",a:1,min:1.25,i:[
 ["Sokol stěhovavý (střemhlav)",320],["Gepard",110],["Pštros",70],["Usain Bolt (nejvyšší rychlost)",44.7],
 ["Želva obrovská",0.3],["Hlemýžď zahradní",0.05]]},
{v:"rychlost",c:"Technika",s:"rychlost",min:1.1,i:[
 ["Světlo",1079000000],["Parker Solar Probe (rekord)",692000],["Země na oběžné dráze",107000],
 ["Voyager 1",61000],["ISS",27600],["Kulka z AK-47",2600],["Concorde",2180],["Otáčení Země na rovníku",1670],
 ["Zvuk ve vzduchu",1235],["Boeing 747 (cestovní)",910],["Rekord TGV",574.8],["Bugatti Chiron Super Sport",490],
 ["Šinkansen (provoz)",320]]},
{v:"vek",c:"Zvířata",s:"nejvyšší doložený věk",a:1,min:1.15,i:[
 ["Velryba grónská",211],["Člověk (Jeanne Calmentová)",122],["Slon (Lin Wang)",86],["Kakadu (Cookie)",83],
 ["Kůň (Old Billy)",62],["Kočka (Creme Puff)",38],["Pes (Bluey)",29]]},
{v:"kcal",c:"Jídlo",s:"energie na 100 g (podle receptury se liší)",a:1,min:1.25,i:[
 ["Olivový olej",884],["Máslo",730],["Vlašské ořechy",654],["Hořká čokoláda 70 %",600],["Arašídy",567],
 ["Kešu",553],["Bramborové lupínky",536],["Mléčná čokoláda",535],["Cukr",400],["Ementál",380],["Hranolky",312],
 ["Med",304],["Rohlík",290],["Hovězí mleté",254],["Chléb",250],["Losos",208],["Avokádo",160],["Těstoviny (vařené)",158],
 ["Vejce (vařené)",155],["Rýže (vařená)",130],["Kuřecí prsa",120],["Banán",89],["Brambory (vařené)",87],
 ["Mléko plnotučné",64],["Jablko",52],["Coca-Cola",42],["Mrkev",41],["Rajče",18],["Okurka",15]]},
// ---------- vesmír ----------
{v:"sirka",c:"Vesmír",s:"průměr tělesa (u Austrálie šířka západ–východ)",min:1.05,i:[
 ["Slunce",1392700],["Jupiter",139820],["Saturn",116460],["Uran",50724],["Neptun",49244],["Země",12742],
 ["Venuše",12104],["Mars",6779],["Ganymed",5268],["Titan",5150],["Merkur",4879],["Kallisto",4821],
 ["Austrálie (západ–východ)",4000],["Io",3643],["Měsíc",3475],["Europa",3122],["Triton",2707],["Pluto",2377],
 ["Ceres",939]]},
{v:"slunce",c:"Vesmír",s:"průměrná vzdálenost od Slunce",min:1.05,i:[
 ["Merkur",57.9],["Venuše",108.2],["Země",149.6],["Mars",227.9],["Ceres",414],["Jupiter",778.5],["Saturn",1432],
 ["Uran",2867],["Neptun",4515],["Pluto",5906]]},
{v:"obeh",c:"Vesmír",s:"doba jednoho oběhu kolem Slunce",min:1.05,i:[
 ["Merkur",88],["Venuše",225],["Země",365],["Mars",687],["Ceres",1682],["Jupiter",4333],["Saturn",10759],
 ["Halleyova kometa",27500],["Uran",30687],["Neptun",60190],["Pluto",90560]]},
{v:"hvezdy",c:"Vesmír",s:"vzdálenost od Země (u vzdálených hvězd odhad)",a:1,min:1.3,i:[
 ["Proxima Centauri",4.24],["Sirius",8.6],["Vega",25],["Arktur",36.7],["Aldebaran",65],["Polárka",430],
 ["Rigel",860],["Střed Mléčné dráhy",26000],["Velké Magellanovo mračno",160000],["Galaxie v Andromedě",2500000]]},
// ---------- hloubka ----------
{v:"hloubka",c:"Příroda",s:"největší hloubka",a:1,min:1.08,i:[
 ["Vrt Kola (nejhlubší vrt)",12262],["Mariánský příkop",10935],["Portorický příkop",8376],["Důl Mponeng",4000],
 ["Vrak Titanicu",3800],["Ponor zobákovce Cuvierova (rekord)",2992],["Jeskyně Veryovkina",2212],["Bajkal",1642],
 ["Tanganika",1470],["Kaspické moře",1025],["Kráterové jezero (Oregon)",594],["Jezero Tahoe",501],
 ["Lago di Garda",346],["Potápění s přístrojem (rekord)",332],["Ženevské jezero",310],["Bodamské jezero",251],
 ["Loch Ness",227],["Volné potápění bez omezení (rekord)",214],["Propast Macocha",138.7],
 ["Černé jezero (Šumava)",40],["Čertovo jezero",36],["Plešné jezero",18]]},
// ---------- zvířata ----------
{v:"divoci",c:"Zvířata",s:"odhad počtu ve volné přírodě",a:1,min:1.4,i:[
 ["Slon africký",415000,"odhad IUCN, 2016"],["Šimpanz",250000,"odhad IUCN: 170–300 tisíc"],
 ["Žirafa",117000,"odhad GCF, 2020"],["Orangutan bornejský",104700,"odhad IUCN, 2016"],
 ["Lední medvěd",26000,"odhad IUCN/PBSG: 22–31 tisíc"],["Lev",23000,"odhad IUCN: 20–25 tisíc"],
 ["Nosorožec bílý",17500,"odhad IUCN, 2024"],["Gepard",7000,"odhad: asi 6 500–7 100"],
 ["Nosorožec černý",6400,"odhad IUCN, 2024"],["Tygr",5600,"odhad GTF, 2023"],
 ["Panda velká",1864,"sčítání v Číně, 2014"],["Gorila horská",1063,"sčítání, 2018"],
 ["Sviňucha kalifornská",8,"odhad 2024: 6–8 kusů"]]},
{v:"sloni",c:"Zvířata",s:"odhad počtu divokých slonů",a:1,min:1.4,i:[
 ["Botswana",130000,"letecké sčítání KAZA, 2022"],["Zimbabwe",100000,"letecké sčítání KAZA, 2022"],
 ["Tanzanie",60000,"odhad TAWIRI"],["Keňa",36000,"sčítání KWS, 2021"],["Indie",22000,"sčítání podle DNA, 2025"],
 ["Srí Lanka",6500,"odhad"],["Thajsko",3500,"odhad"]]},
// ---------- sport ----------
{v:"nhl",c:"Sport",s:"góly v základní části NHL",min:1.05,i:[
 ["Wayne Gretzky",894],["Gordie Howe",801],["Jaromír Jágr",766],["Brett Hull",741],["Marcel Dionne",731],
 ["Phil Esposito",717],["Mike Gartner",708],["Mark Messier",694],["Steve Yzerman",692],["Mario Lemieux",690],
 ["Teemu Selänne",684],["Luc Robitaille",668],["Brendan Shanahan",656],["Dave Andreychuk",640],["Joe Sakic",625],
 ["Bobby Hull",610],["Jari Kurri",601],["Mike Bossy",573],["Peter Šťastný",450],["Patrik Eliáš",408],
 ["Milan Hejduk",375]]},
{v:"gs",c:"Sport",s:"grandslamové tituly ve dvouhře",min:1.05,i:[
 ["Margaret Courtová",24],["Serena Williamsová",23],["Steffi Grafová",22],["Rafael Nadal",22],["Roger Federer",20],
 ["Martina Navrátilová",18],["Chris Evertová",18],["Pete Sampras",14],["Björn Borg",11],["Rod Laver",11],
 ["Monika Selešová",9],["Andre Agassi",8],["Ivan Lendl",8],["Jimmy Connors",8],["John McEnroe",7],
 ["Venus Williamsová",7],["Justine Heninová",7],["Hana Mandlíková",4],["Petra Kvitová",2]]},
// ---------- peníze ----------
{v:"trzby",c:"Peníze",s:"celosvětové tržby v kinech (Box Office Mojo)",a:1,min:1.1,i:[
 ["Avatar",2923000000],["Avengers: Endgame",2799000000],["Avatar: The Way of Water",2320000000],
 ["Titanic",2264000000],["Star Wars: Síla se probouzí",2071000000],["Avengers: Infinity War",2052000000],
 ["Spider-Man: Bez domova",1922000000],["V hlavě 2",1699000000],["Jurský svět",1671000000],["Lví král (2019)",1663000000],
 ["Top Gun: Maverick",1496000000],["Ledové království II",1453000000],["Barbie",1446000000],
 ["Super Mario Bros. ve filmu",1362000000],["Harry Potter a Relikvie smrti – část 2",1342000000],
 ["Deadpool & Wolverine",1338000000],["Ledové království",1284000000],["Joker",1079000000],["Oppenheimer",976000000]]},
{v:"prestup",c:"Sport",s:"přestupní částka bez bonusů",a:1,min:1.15,i:[
 ["Neymar (Barcelona → PSG, 2017)",222000000],["Kylian Mbappé (Monako → PSG, 2018)",180000000],
 ["João Félix (Benfica → Atlético, 2019)",126000000],["Enzo Fernández (Benfica → Chelsea, 2023)",121000000],
 ["Paul Pogba (Juventus → Manchester United, 2016)",105000000],["Gareth Bale (Tottenham → Real, 2013)",101000000],
 ["Cristiano Ronaldo (Manchester United → Real, 2009)",94000000],["Zinedine Zidane (Juventus → Real, 2001)",77500000],
 ["Luís Figo (Barcelona → Real, 2000)",60000000]]},
// ---------- jídlo ----------
{v:"voda",c:"Jídlo",s:"průměrná vodní stopa (Water Footprint Network)",a:1,min:1.3,i:[
 ["Pražená káva",18900],["Čokoláda",17196],["Hovězí maso",15415],["Skopové maso",10412],["Vepřové maso",5988],
 ["Kuřecí maso",4325],["Vejce",3265],["Sýr",3178],["Rýže",2497],["Cukr",1782],["Chléb",1608],["Mléko",1020],
 ["Jablka",822],["Banány",790],["Brambory",287],["Rajčata",214]]},
{v:"kofein",c:"Jídlo",s:"obsah kofeinu v běžné porci (přibližně)",a:1,min:1.4,i:[
 ["Monster Energy (500 ml)",160],["Filtrovaná káva (250 ml)",120],["Red Bull (250 ml)",80],["Espresso (30 ml)",63],
 ["Černý čaj (250 ml)",50],["Coca-Cola (330 ml)",33],["Bezkofeinová káva (250 ml)",5]]},
// ---------- stáří (hodnota = rok vzniku; hra počítá, kolik let to je) ----------
{v:"stari",c:"Historie",s:"rok vzniku nebo dokončení",y:1,min:1.08,i:[
 ["Stonehenge",-3000,"první fáze kolem roku 3000 př. n. l."],["Velká pyramida v Gíze",-2560,"kolem roku 2560 př. n. l."],
 ["Parthenón",-432],["Koloseum",80],["Pražský hrad",880,"založen kolem roku 880"],["Notre-Dame v Paříži",1163,"začátek stavby"],
 ["Univerzita Karlova",1348],["Karlův most",1357,"začátek stavby"],["Pražský orloj",1410],["Tádž Mahal",1653],
 ["Plzeňský Prazdroj",1842],["Big Ben",1859],["Brooklynský most",1883],["Socha Svobody",1886],["Coca-Cola",1886],
 ["Eiffelova věž",1889],["Petřínská rozhledna",1891],["Laurin & Klement",1895],["Novodobé olympijské hry",1896],
 ["Československo",1918],["Empire State Building",1931],["Zoo Praha",1931],["Golden Gate",1937],["OSN",1945],
 ["Kostka LEGO (dnešní podoba)",1958],["Rubikova kostka",1974],["Pražské metro",1974],["Game Boy",1989],
 ["World Wide Web",1991],["Žižkovská věž",1992],["Česká republika",1993],["Windows 95",1995],["Tančící dům",1996],
 ["Google",1998],["Wikipedie",2001],["Eurobankovky",2002],["Facebook",2004],["YouTube",2005],["iPhone",2007],
 ["Bitcoin",2009],["Burdž Chalífa",2010],["Instagram",2010],["ChatGPT",2022]]},
// ---------- délka ----------
{v:"delka",c:"Rekordy",s:"délka",min:1.1,i:[
 ["Velká čínská zeď (dynastie Ming)",8850000],["Gotthardský úpatní tunel",57100],["Eurotunel",50450],
 ["Golden Gate (celý most)",2737],["Viadukt Millau",2460],["Karlův most",516],["Icon of the Seas",365],
 ["Letadlová loď USS Gerald R. Ford",337],["Titanic",269],["Fotbalové hřiště",105],["Boeing 747-8",76.3],
 ["Kluziště NHL",61],["Olympijský bazén",50],["Basketbalové hřiště",28],["Tenisový kurt",23.77]]},
{v:"delka",c:"Zvířata",s:"délka dospělého jedince (přibližně)",a:1,min:1.3,i:[
 ["Plejtvák obrovský (délka)",25],["Tyrannosaurus rex",12],["Krajta mřížkovaná",6]]},
// ---------- počty („Čeho je víc?“) ----------
{v:"pocet",c:"Kvíz",s:"",min:1.05,i:[
 ["Kostí v těle dospělého člověka",206],["Kláves na klavíru",88],["Karet v balíčku žolíkových karet bez žolíků",52],
 ["Políček na šachovnici",64],["Států USA",50],["Krajů České republiky",14],["Států Evropské unie",27],
 ["Členských států OSN",193],["Chemických prvků",118],["Dní v roce",365],["Hodin v týdnu",168],["Minut ve dni",1440],
 ["Sekund v hodině",3600],["Pokémonů 1. generace",151],["Zubů dospělého člověka",32],["Mléčných zubů",20],
 ["Chromozomů v lidské buňce",46],["Chromozomů psa",78],["Poslanců Poslanecké sněmovny",200],["Senátorů ČR",81],
 ["Senátorů USA",100],["Členů Sněmovny reprezentantů USA",435],["Stanic pražského metra",61],["Souhvězdí",88],
 ["Kostí v lidské ruce i se zápěstím",27],["Krčních obratlů žirafy",7],["Nohou pavouka",8],["Srdcí chobotnice",3],
 ["Planet Sluneční soustavy",8],["Políček ve hře Monopoly",40],["Kamenů domina",28],["Teček na hrací kostce",21],
 ["Hráčů fotbalového týmu na hřišti",11],["Hráčů ragbyového týmu na hřišti",15],["Knih o Harrym Potterovi",7],
 ["Beethovenových symfonií",9],["Haydnových symfonií",104],["Písmen anglické abecedy",26],["Států Afriky",54],
 ["Časových pásem Ruska",11],["Žeber člověka",24],["Let ve století",100],["Týdnů v roce",52],
 ["Oscarů za film Titanic",11],["Dílů seriálu Přátelé",236],["Pater Burdž Chalífa",163]]}
]};
