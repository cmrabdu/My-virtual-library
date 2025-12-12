# Changelog - Refonte Profil & Paramètres

## v0.5.7.0 - Profil Public Style Instagram

### 🎯 Objectif
Séparer la vue publique du profil des paramètres privés, similaire à Instagram/Twitter.

### ✨ Nouveautés

#### 📱 Page Profil (Vue Publique)
- **Carte profil stylée** avec gradient violet
  - Avatar emoji personnalisable (100px)
  - @username formaté automatiquement
  - Biographie courte (120 caractères max)
  - Stats visuelles (Livres, Lus, Pages)
  
- **Section Meilleurs Livres**
  - Affiche les livres 5 étoiles
  - Grille responsive (8 livres max)
  - Cliquables pour voir détails
  
- **Section Livres Récents**
  - 6 derniers livres ajoutés
  - Tri automatique par date
  - Cards mini avec hover effect

- **Bouton Paramètres**
  - Accès rapide en haut à droite
  - Design moderne avec gradient bleu-violet

#### ⚙️ Page Paramètres (Séparée)

**Tab 1 : Profil**
- Emoji picker (12 emojis au choix)
- Nom d'utilisateur
- Biographie (120 caractères)
- Compteur de caractères en temps réel

**Tab 2 : Compte**
- Objectif annuel de lecture
- Infos version app
- Préférences futures

**Tab 3 : Données**
- Import bibliothèque (JSON)
- Export bibliothèque
- Supprimer données (zone danger)

### 🎨 Design

**Couleurs**
- Profil : Gradient violet (#667eea → #764ba2)
- Paramètres : Gradient bleu-violet (#6366f1 → #8b5cf6)
- Emoji picker : Bleu ciel (#f0f9ff → #e0f2fe)

**Responsive**
- Mobile : Stats compactes, grille 3-4 colonnes
- Desktop : Grille 6-8 colonnes, full width
- Tabs : Labels cachés sur mobile

### 🔧 Technique

**Fichiers modifiés**
- `index.html` : Nouvelle structure (page-profile + page-settings)
- `css/style.css` : +350 lignes de styles
- `js/router.js` : Nouvelles fonctions (updatePublicProfile, updateSettingsPage, etc.)

**Nouvelles fonctions JS**
- `updatePublicProfile()` : Affiche vue publique
- `displayFavoriteBooks()` : Livres 5 étoiles
- `displayRecentBooks()` : Derniers ajouts
- `updateSettingsPage()` : Charge paramètres
- Navigation : Boutons Paramètres ↔ Profil

**LocalStorage**
- `userAvatar` : Emoji choisi (défaut: 📚)
- `userName` : Nom utilisateur
- `userBio` : Biographie (120 chars max)
- `yearlyGoal` : Objectif annuel

### 🚀 Navigation

```
Bottom Nav "Profil" → Page Profil Public
  └─ Bouton "Paramètres" → Page Paramètres
      └─ Bouton "← Profil" → Retour Page Profil
```

### 📊 Préparation Future (Supabase)

Cette structure facilite la migration vers profils multi-users :
- Vue publique = Profil partageable
- URL type : `/profile/@username`
- Paramètres = Zone privée uniquement
- Avatar = Upload photo future

### ✅ Tests à faire

- [ ] Cliquer sur Paramètres depuis Profil
- [ ] Revenir au Profil depuis Paramètres
- [ ] Changer d'emoji et vérifier l'affichage
- [ ] Modifier username et bio
- [ ] Vérifier stats (livres, pages)
- [ ] Cliquer sur un livre favori
- [ ] Tester responsive mobile
- [ ] Vérifier sauvegarde localStorage

### 🎯 Prochaines étapes

1. Tester sur mobile réel
2. Ajouter animations transitions
3. Implémenter partage profil (export image)
4. Préparer pour Supabase (avatars uploads)
5. Ajouter genres préférés
6. Statistiques avancées dans profil public
