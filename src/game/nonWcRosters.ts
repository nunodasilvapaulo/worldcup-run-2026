import type { PlayerTemplate } from './players2026'
import { PLACEHOLDER_PHOTO, wikiPhoto } from './photoUrls'

const W = wikiPhoto
const ball = PLACEHOLDER_PHOTO

/** Last call-up squads for nations not at WC 2026 (friendlies only). */
export const NON_WC_ROSTERS: Record<string, PlayerTemplate[]> = {
  italy: [
    { name: 'Gianluigi Donnarumma', role: 'GK', photoUrl: W('9/9e/Gianluigi_Donnarumma.jpg/220px-Gianluigi_Donnarumma.jpg'), base: { pace: 40, shoot: 14, pass: 48, defend: 88 } },
    { name: 'Alessandro Bastoni', role: 'DEF', photoUrl: W('4/4e/Alessandro_Bastoni.jpg/220px-Alessandro_Bastoni.jpg'), base: { pace: 62, shoot: 38, pass: 68, defend: 86 } },
    { name: 'Nicolò Barella', role: 'MID', photoUrl: W('4/4f/Nicol%C3%B2_Barella.jpg/220px-Nicol%C3%B2_Barella.jpg'), base: { pace: 72, shoot: 68, pass: 84, defend: 58 } },
    { name: 'Federico Chiesa', role: 'WNG', photoUrl: W('8/8a/Federico_Chiesa.jpg/220px-Federico_Chiesa.jpg'), base: { pace: 88, shoot: 80, pass: 72, defend: 40 } },
    { name: 'Giacomo Raspadori', role: 'ST', photoUrl: W('5/5e/Giacomo_Raspadori.jpg/220px-Giacomo_Raspadori.jpg'), base: { pace: 78, shoot: 82, pass: 62, defend: 42 } },
    { name: 'Francesco Acerbi', role: 'DEF', photoUrl: ball, base: { pace: 55, shoot: 34, pass: 58, defend: 84 } },
    { name: 'Jorginho', role: 'MID', photoUrl: ball, base: { pace: 58, shoot: 55, pass: 82, defend: 62 } },
  ],
  poland: [
    { name: 'Wojciech Szczęsny', role: 'GK', photoUrl: W('4/4e/Wojciech_Szcz%C4%99sny_2018.jpg/220px-Wojciech_Szcz%C4%99sny_2018.jpg'), base: { pace: 38, shoot: 12, pass: 46, defend: 86 } },
    { name: 'Piotr Zieliński', role: 'MID', photoUrl: ball, base: { pace: 70, shoot: 72, pass: 84, defend: 55 } },
    { name: 'Robert Lewandowski', role: 'ST', photoUrl: W('0/0e/Robert_Lewandowski_2018.jpg/220px-Robert_Lewandowski_2018.jpg'), base: { pace: 72, shoot: 92, pass: 78, defend: 48 } },
    { name: 'Kamil Glik', role: 'DEF', photoUrl: ball, base: { pace: 52, shoot: 32, pass: 55, defend: 82 } },
    { name: 'Sebastian Szymański', role: 'WNG', photoUrl: ball, base: { pace: 82, shoot: 74, pass: 76, defend: 38 } },
  ],
  chile: [
    { name: 'Claudio Bravo', role: 'GK', photoUrl: ball, base: { pace: 36, shoot: 12, pass: 50, defend: 82 } },
    { name: 'Gary Medel', role: 'DEF', photoUrl: ball, base: { pace: 58, shoot: 35, pass: 62, defend: 80 } },
    { name: 'Arturo Vidal', role: 'MID', photoUrl: W('4/4e/Arturo_Vidal_2018.jpg/220px-Arturo_Vidal_2018.jpg'), base: { pace: 68, shoot: 72, pass: 78, defend: 68 } },
    { name: 'Alexis Sánchez', role: 'WNG', photoUrl: W('7/7d/Alexis_S%C3%A1nchez_2018.jpg/220px-Alexis_S%C3%A1nchez_2018.jpg'), base: { pace: 84, shoot: 78, pass: 74, defend: 42 } },
    { name: 'Eduardo Vargas', role: 'ST', photoUrl: ball, base: { pace: 76, shoot: 80, pass: 58, defend: 40 } },
  ],
  cameroon: [
    { name: 'André Onana', role: 'GK', photoUrl: W('4/4e/Andr%C3%A9_Onana.jpg/220px-Andr%C3%A9_Onana.jpg'), base: { pace: 40, shoot: 14, pass: 52, defend: 86 } },
    { name: 'André-Frank Zambo Anguissa', role: 'MID', photoUrl: ball, base: { pace: 72, shoot: 62, pass: 76, defend: 72 } },
    { name: 'Vincent Aboubakar', role: 'ST', photoUrl: ball, base: { pace: 74, shoot: 82, pass: 58, defend: 42 } },
    { name: 'Bryan Mbeumo', role: 'WNG', photoUrl: ball, base: { pace: 86, shoot: 78, pass: 68, defend: 38 } },
    { name: 'Jean-Charles Castelletto', role: 'DEF', photoUrl: ball, base: { pace: 58, shoot: 32, pass: 55, defend: 78 } },
  ],
  venezuela: [
    { name: 'Rafael Romo', role: 'GK', photoUrl: ball, base: { pace: 36, shoot: 12, pass: 44, defend: 76 } },
    { name: 'Salomón Rondón', role: 'ST', photoUrl: ball, base: { pace: 68, shoot: 80, pass: 60, defend: 45 } },
    { name: 'Jhon Murillo', role: 'WNG', photoUrl: ball, base: { pace: 82, shoot: 72, pass: 62, defend: 38 } },
    { name: 'Jhon Chancellor', role: 'DEF', photoUrl: ball, base: { pace: 56, shoot: 30, pass: 52, defend: 76 } },
    { name: 'Tomás Rincón', role: 'MID', photoUrl: ball, base: { pace: 62, shoot: 55, pass: 72, defend: 68 } },
  ],
  china: [
    { name: 'Wang Dalei', role: 'GK', photoUrl: ball, base: { pace: 36, shoot: 12, pass: 42, defend: 74 } },
    { name: 'Wu Lei', role: 'ST', photoUrl: ball, base: { pace: 78, shoot: 76, pass: 58, defend: 40 } },
    { name: 'Zhang Yuning', role: 'ST', photoUrl: ball, base: { pace: 72, shoot: 74, pass: 55, defend: 42 } },
    { name: 'Jiang Guangtai', role: 'DEF', photoUrl: ball, base: { pace: 54, shoot: 30, pass: 50, defend: 74 } },
    { name: 'Xu Xin', role: 'MID', photoUrl: ball, base: { pace: 64, shoot: 58, pass: 70, defend: 58 } },
  ],
  nigeria: [
    { name: 'Stanley Nwabali', role: 'GK', photoUrl: ball, base: { pace: 38, shoot: 12, pass: 44, defend: 80 } },
    { name: 'Victor Osimhen', role: 'ST', photoUrl: ball, base: { pace: 82, shoot: 86, pass: 58, defend: 42 } },
    { name: 'Ademola Lookman', role: 'WNG', photoUrl: ball, base: { pace: 86, shoot: 78, pass: 72, defend: 40 } },
    { name: 'Wilfred Ndidi', role: 'MID', photoUrl: ball, base: { pace: 68, shoot: 55, pass: 72, defend: 74 } },
    { name: 'William Troost-Ekong', role: 'DEF', photoUrl: ball, base: { pace: 56, shoot: 32, pass: 52, defend: 80 } },
  ],
  ukraine: [
    { name: 'Andriy Lunin', role: 'GK', photoUrl: ball, base: { pace: 38, shoot: 12, pass: 46, defend: 82 } },
    { name: 'Oleksandr Zinchenko', role: 'DEF', photoUrl: ball, base: { pace: 68, shoot: 48, pass: 78, defend: 76 } },
    { name: 'Ruslan Malinovskyi', role: 'MID', photoUrl: ball, base: { pace: 66, shoot: 72, pass: 80, defend: 55 } },
    { name: 'Viktor Tsygankov', role: 'WNG', photoUrl: ball, base: { pace: 84, shoot: 76, pass: 72, defend: 38 } },
    { name: 'Roman Yaremchuk', role: 'ST', photoUrl: ball, base: { pace: 72, shoot: 78, pass: 58, defend: 42 } },
  ],
  denmark: [
    { name: 'Kasper Schmeichel', role: 'GK', photoUrl: ball, base: { pace: 38, shoot: 12, pass: 48, defend: 84 } },
    { name: 'Simon Kjær', role: 'DEF', photoUrl: ball, base: { pace: 52, shoot: 34, pass: 62, defend: 82 } },
    { name: 'Christian Eriksen', role: 'MID', photoUrl: W('4/4f/Christian_Eriksen_2018.jpg/220px-Christian_Eriksen_2018.jpg'), base: { pace: 68, shoot: 72, pass: 88, defend: 52 } },
    { name: 'Rasmus Højlund', role: 'ST', photoUrl: ball, base: { pace: 80, shoot: 82, pass: 58, defend: 40 } },
    { name: 'Andreas Skov Olsen', role: 'WNG', photoUrl: ball, base: { pace: 84, shoot: 74, pass: 68, defend: 38 } },
  ],
  wales: [
    { name: 'Danny Ward', role: 'GK', photoUrl: ball, base: { pace: 36, shoot: 12, pass: 44, defend: 78 } },
    { name: 'Gareth Bale', role: 'WNG', photoUrl: W('3/3e/Gareth_Bale_2018.jpg/220px-Gareth_Bale_2018.jpg'), base: { pace: 86, shoot: 84, pass: 76, defend: 42 } },
    { name: 'Aaron Ramsey', role: 'MID', photoUrl: ball, base: { pace: 70, shoot: 68, pass: 82, defend: 58 } },
    { name: 'Ben Davies', role: 'DEF', photoUrl: ball, base: { pace: 68, shoot: 35, pass: 62, defend: 78 } },
    { name: 'Kieffer Moore', role: 'ST', photoUrl: ball, base: { pace: 68, shoot: 76, pass: 55, defend: 48 } },
  ],
  serbia: [
    { name: 'Vanja Milinković-Savić', role: 'GK', photoUrl: ball, base: { pace: 36, shoot: 12, pass: 44, defend: 80 } },
    { name: 'Aleksandar Mitrović', role: 'ST', photoUrl: ball, base: { pace: 72, shoot: 84, pass: 62, defend: 45 } },
    { name: 'Dušan Vlahović', role: 'ST', photoUrl: ball, base: { pace: 76, shoot: 86, pass: 58, defend: 42 } },
    { name: 'Sergej Milinković-Savić', role: 'MID', photoUrl: ball, base: { pace: 68, shoot: 70, pass: 82, defend: 62 } },
    { name: 'Strahinja Pavlović', role: 'DEF', photoUrl: ball, base: { pace: 58, shoot: 32, pass: 55, defend: 80 } },
  ],
  peru: [
    { name: 'Pedro Gallese', role: 'GK', photoUrl: ball, base: { pace: 36, shoot: 12, pass: 44, defend: 78 } },
    { name: 'Paolo Guerrero', role: 'ST', photoUrl: ball, base: { pace: 68, shoot: 82, pass: 62, defend: 45 } },
    { name: 'André Carrillo', role: 'WNG', photoUrl: ball, base: { pace: 82, shoot: 74, pass: 70, defend: 40 } },
    { name: 'Renato Tapia', role: 'MID', photoUrl: ball, base: { pace: 66, shoot: 58, pass: 74, defend: 68 } },
    { name: 'Christian Ramos', role: 'DEF', photoUrl: ball, base: { pace: 54, shoot: 30, pass: 52, defend: 76 } },
  ],
  'costa-rica': [
    { name: 'Keylor Navas', role: 'GK', photoUrl: W('7/7e/Keylor_Navas_2018.jpg/220px-Keylor_Navas_2018.jpg'), base: { pace: 38, shoot: 12, pass: 46, defend: 86 } },
    { name: 'Joel Campbell', role: 'WNG', photoUrl: ball, base: { pace: 82, shoot: 74, pass: 68, defend: 40 } },
    { name: 'Bryan Ruiz', role: 'MID', photoUrl: ball, base: { pace: 66, shoot: 68, pass: 80, defend: 55 } },
    { name: 'Francisco Calvo', role: 'DEF', photoUrl: ball, base: { pace: 58, shoot: 32, pass: 55, defend: 76 } },
    { name: 'Johan Venegas', role: 'ST', photoUrl: ball, base: { pace: 74, shoot: 76, pass: 55, defend: 42 } },
  ],
  jamaica: [
    { name: 'Andre Blake', role: 'GK', photoUrl: ball, base: { pace: 36, shoot: 12, pass: 42, defend: 76 } },
    { name: 'Leon Bailey', role: 'WNG', photoUrl: ball, base: { pace: 90, shoot: 76, pass: 68, defend: 38 } },
    { name: 'Michail Antonio', role: 'ST', photoUrl: ball, base: { pace: 78, shoot: 78, pass: 58, defend: 42 } },
    { name: 'Shamar Nicholson', role: 'ST', photoUrl: ball, base: { pace: 76, shoot: 74, pass: 52, defend: 40 } },
    { name: 'Damion Lowe', role: 'DEF', photoUrl: ball, base: { pace: 56, shoot: 30, pass: 50, defend: 74 } },
  ],
  thailand: [
    { name: 'Siwakorn Mukdasai', role: 'GK', photoUrl: ball, base: { pace: 34, shoot: 10, pass: 40, defend: 72 } },
    { name: 'Chanathip Songkrasin', role: 'MID', photoUrl: ball, base: { pace: 72, shoot: 68, pass: 82, defend: 48 } },
    { name: 'Supachai Jaided', role: 'ST', photoUrl: ball, base: { pace: 74, shoot: 74, pass: 55, defend: 40 } },
    { name: 'Teerasil Dangda', role: 'ST', photoUrl: ball, base: { pace: 70, shoot: 72, pass: 58, defend: 42 } },
    { name: 'Pansa Hemviboon', role: 'DEF', photoUrl: ball, base: { pace: 54, shoot: 28, pass: 50, defend: 72 } },
  ],
}
