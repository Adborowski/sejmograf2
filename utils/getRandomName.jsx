//prettier-ignore
const names = [
    // Male
    "Adam", "Andrzej", "Bartłomiej", "Borys", "Cezary", "Damian", "Dariusz", "Dominik", "Emil", "Filip",
    "Grzegorz", "Henryk", "Igor", "Jan", "Jarosław", "Józef", "Kamil", "Karol", "Krzysztof", "Łukasz",
    "Maciej", "Marek", "Mateusz", "Michał", "Paweł", "Piotr", "Rafał", "Ryszard", "Sebastian", "Szymon",
    "Tadeusz", "Tomasz", "Waldemar", "Wiesław", "Wiktor", "Wojciech", "Zbigniew", "Zenon", "Arkadiusz", "Artur",
    "Bartosz", "Eryk", "Fryderyk", "Konrad", "Lech", "Marcin", "Norbert", "Patryk", "Stanisław", "Władysław",
    // Female
    "Agnieszka", "Aleksandra", "Aneta", "Anna", "Barbara", "Beata", "Bożena", "Cecylia", "Dorota", "Edyta",
    "Elżbieta", "Ewa", "Gabriela", "Grażyna", "Halina", "Irena", "Izabela", "Joanna", "Jolanta", "Julia",
    "Justyna", "Katarzyna", "Kinga", "Krystyna", "Lidia", "Lucyna", "Magdalena", "Małgorzata", "Maria", "Marta",
    "Monika", "Natalia", "Nina", "Oliwia", "Patrycja", "Paulina", "Renata", "Roksana", "Sylwia", "Teresa",
    "Urszula", "Weronika", "Wiesława", "Wiktoria", "Zofia", "Żaneta", "Alina", "Kamila", "Mariola", "Zuzanna"
  ];

//prettier-ignore
const nouns = [
    "jabłko", "samochód", "pies", "dom", "kwiat", "szkoła", "książka", "krzesło", "stół", "miasto",
    "rzeka", "jezioro", "las", "góra", "słońce", "księżyc", "morze", "drzewo", "dziecko", "kobieta",
    "mężczyzna", "samolot", "statek", "chleb", "woda", "mleko", "okno", "drzwi", "telefon", "zegarek",
    "klucz", "rower", "szafa", "łóżko", "park", "ogród", "droga", "kwiaciarnia", "muzeum", "kino",
    "apteka", "szpital", "miłość", "przyjaźń", "praca", "nauka", "zabawa", "zwierzę", "ptak", "ryba",
    "kot", "sowa", "mysz", "miś", "zegar", "pociąg", "autobus", "walizka", "buty", "kurtka", "czapka",
    "piłka", "zabawa", "chmura", "deszcz", "śnieg", "wiatr", "burza", "sukienka", "kwiaty", "kawa",
    "herbata", "cukier", "ciastko", "warzywa", "owoce", "samotność", "radość", "strach", "taniec", 
    "muzyka", "książka", "obraz", "film", "teatr", "wulkan", "wyspa", "długopis", "ołówek", "papier",
    "głos", "śpiew", "nadzieja", "las", "pole", "łąka", "wiadomość", "podróż", "zdrowie", "szczęście"
  ];

export const getRandomName = () => {
  const i1 = Math.floor(Math.random() * names.length);
  const i2 = Math.floor(Math.random() * names.length);
  const firstName = names[i1];
  let lastName = nouns[i2];
  lastName = lastName.split("");
  lastName[0] = lastName[0].toUpperCase();
  lastName = lastName.join("");
  return `${firstName} ${lastName}`;
};
