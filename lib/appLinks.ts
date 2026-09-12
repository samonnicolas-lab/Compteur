// URL publique de l'app (site web déployé) : toujours celle-ci dans les
// messages partagés (invitation...), quelle que soit la plateforme depuis
// laquelle le message est composé — c'est le destinataire qui l'ouvre dans
// un navigateur, pas forcément l'expéditeur.
export const APP_WEB_URL = 'https://samonnicolas-lab.github.io/Compteur/';

export function buildInviteMessage(counterName: string, inviteCode: string): string {
  return (
    `Salut !!! Rejoins mon compteur ${counterName} en cliquant sur le lien : ${APP_WEB_URL}\n` +
    `Utilise mon code d'invitation lorsque tu crées un Nouveau compteur -> clique sur Rejoindre un compteur et tape ce code : ${inviteCode}`
  );
}
