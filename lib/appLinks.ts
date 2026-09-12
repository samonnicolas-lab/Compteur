// URL publique de l'app (site web déployé) : toujours celle-ci dans les
// messages partagés (invitation...), quelle que soit la plateforme depuis
// laquelle le message est composé — c'est le destinataire qui l'ouvre dans
// un navigateur, pas forcément l'expéditeur.
export const APP_WEB_URL = 'https://samonnicolas-lab.github.io/Compteur/';

export function buildInviteMessage(counterName: string, inviteCode: string): string {
  return (
    `Salut !!! Rejoins mon 📊 - ${counterName}.\n` +
    `Clique sur le lien : ${APP_WEB_URL}\n` +
    `1 - créé ton compte\n` +
    `2 - une fois connecté, clique sur + Nouveau compteur\n` +
    `3 - clique sur Rejoindre un compteur\n` +
    `4 - copie/colle ce code ${inviteCode}\n` +
    `5 - recherche un groupe\n` +
    `et c'est parti !!! 🎉`
  );
}
