import connexionAnglais from '../../../../public/i18n/connexion/en.json';
import connexionFrancais from '../../../../public/i18n/connexion/fr.json';
import connexionMalgache from '../../../../public/i18n/connexion/mg.json';
import anglais from '../../../../public/i18n/en.json';
import francais from '../../../../public/i18n/fr.json';
import layoutAnglais from '../../../../public/i18n/layout/en.json';
import layoutFrancais from '../../../../public/i18n/layout/fr.json';
import layoutMalgache from '../../../../public/i18n/layout/mg.json';
import malgache from '../../../../public/i18n/mg.json';
import tableauDeBordAnglais from '../../../../public/i18n/tableau-de-bord/en.json';
import tableauDeBordFrancais from '../../../../public/i18n/tableau-de-bord/fr.json';
import tableauDeBordMalgache from '../../../../public/i18n/tableau-de-bord/mg.json';

// Liste les clés à plat (« commun.theme.mode_clair ») d'un fichier de traductions.
function aplatirCles(objet: object, prefixe = ''): string[] {
  return Object.entries(objet).flatMap(([cle, valeur]) => {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    return typeof valeur === 'object' && valeur !== null ? aplatirCles(valeur, chemin) : [chemin];
  });
}

describe.each([
  { portee: 'commun', fr: francais, en: anglais, mg: malgache },
  { portee: 'connexion', fr: connexionFrancais, en: connexionAnglais, mg: connexionMalgache },
  { portee: 'layout', fr: layoutFrancais, en: layoutAnglais, mg: layoutMalgache },
  {
    portee: 'tableau-de-bord',
    fr: tableauDeBordFrancais,
    en: tableauDeBordAnglais,
    mg: tableauDeBordMalgache,
  },
])('fichiers de traductions « $portee »', ({ fr, en, mg }) => {
  const clesFrancais = aplatirCles(fr).sort();

  it('le français et l’anglais ont exactement les mêmes clés', () => {
    expect(aplatirCles(en).sort()).toEqual(clesFrancais);
  });

  it('le malgache ne contient aucune clé inconnue du français (les clés absentes se replient sur le français)', () => {
    const clesInconnues = aplatirCles(mg).filter((cle) => !clesFrancais.includes(cle));

    expect(clesInconnues).toEqual([]);
  });

  it('aucune traduction n’est vide', () => {
    const valeursVides = [fr, en, mg].flatMap((fichier) =>
      aplatirCles(fichier).filter((cle) =>
        cle.split('.').reduce<unknown>((valeur, morceau) => (valeur as Record<string, unknown>)[morceau], fichier) === '',
      ),
    );

    expect(valeursVides).toEqual([]);
  });
});
