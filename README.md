# 🏆 TOP 5 — Le Jeu de Classement Multijoueur

Un jeu d'ambiance en temps réel où chaque joueur classe 5 mots totalement hétéroclites du **#1 (le plus important)** au **#5 (le moins important)**, suivi d'un reveal progressif avec calcul du consensus et du pourcentage d'accord en direct !

---

## 🚀 Mise en ligne gratuite en 2 minutes (Zéro configuration)

Le duo **GitHub + Render** est la méthode la plus simple au monde pour un jeu multijoueur en temps réel avec WebSockets (Socket.io) :

1. **Crée un dépôt sur GitHub** et pousse ces fichiers.
2. Va sur **[render.com](https://render.com)** et connecte-toi avec ton compte GitHub.
3. Clique sur **"New +"** → **"Web Service"** → sélectionne ton dépôt GitHub.
4. Clique sur **"Deploy Web Service"** tout en bas (laisse toutes les options par défaut).

✨ **C'est tout !** Render installe les dépendances, lance le serveur et te donne une adresse HTTPS gratuite (ex: `https://top5-game.onrender.com`).
Tes potes peuvent s'y connecter 24h/24 depuis n'importe quel PC ou smartphone.

---

## 💻 Ou jouer en local tout de suite

```bash
npm install
npm start
```
Puis ouvre `http://localhost:3000` !

---

## 🎮 Comment se déroule une partie

1. **Création de la salle** : L'hôte crée la partie et partage le code à 5 lettres (ou clique sur "Copier le lien").
2. **Rejoindre** : Les potes rejoignent depuis leurs ordis ou smartphones.
3. **Lancement** : L'hôte génère 5 mots aléatoires sans aucun lien (tirés de la base de données).
4. **Classement** : Chacun classe les mots du **#1** au **#5** (en glissant ou en cliquant) puis valide.
5. **Le Reveal progressif** :
   - Commence par le suspense du **Top 5** (le moins important), puis **Top 4**, **Top 3**, **Top 2**...
   - Jusqu'au grand final du **Top 1** avec des confettis 🎊 !
   - À chaque étape, une jauge animée affiche le mot majoritaire et le **% d'accord** entre tous les joueurs.
   - À la fin, un score global de compatibilité du groupe est calculé !

---

## ⚙️ Espace Base de données (Admin)

Accessible sur `/admin.html` (ou via le lien en bas de page) :
- Ajoute de nouveaux mots un par un.
- Ajoute des dizaines de mots d'un coup en les collant ligne par ligne.
- Recherche et supprime des mots existants.
- Tout est sauvegardé automatiquement dans `words.json`.
