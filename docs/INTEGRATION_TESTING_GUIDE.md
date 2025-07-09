# Guide des Tests d'Intégration avec Next.js

## 🎯 Qu'est-ce qu'un test d'intégration ?

Un **test d'intégration** vérifie que plusieurs composants/modules travaillent correctement **ensemble**, contrairement aux tests unitaires qui testent une fonction isolée.

### 📊 Pyramide des Tests
```
        E2E Tests
       /          \
    Integration Tests
   /                  \
  Unit Tests (base large)
```

## 🔍 Différences clés

| Test Unitaire | Test d'Intégration |
|---------------|-------------------|
| ✅ Teste UNE fonction isolée | ✅ Teste PLUSIEURS composants ensemble |
| ✅ Mocks TOUT sauf la fonction testée | ✅ Mock seulement les dépendances externes |
| ✅ Rapide à exécuter | ⚠️ Plus lent (mais acceptable) |
| ✅ Facile à déboguer | ⚠️ Plus complexe à déboguer |

## 🎯 Quand écrire un test d'intégration ?

✅ **OUI, écrivez un test d'intégration quand :**
- Plusieurs composants doivent collaborer
- Il y a un flux utilisateur important (login, checkout, etc.)
- La logique traverse plusieurs couches (UI → Hook → API)
- Vous voulez tester des contrats entre modules

❌ **NON, utilisez plutôt des tests unitaires quand :**
- Vous testez une fonction utilitaire simple
- Vous testez une logique métier isolée
- Vous voulez tester tous les cas d'erreur d'une fonction

## 🛠️ Comment identifier ce qui doit être testé en intégration

1. **Suivez le flux de données** : `User Input → Component → Hook → API → State Update → UI Change`
2. **Identifiez les interactions critiques** : Quels composants DOIVENT travailler ensemble ?
3. **Listez les scénarios utilisateur** : Connexion, inscription, création de contenu, etc.
4. **Cherchez les points de rupture** : Où les bugs peuvent-ils survenir entre modules ?

## 📝 Exemple concret : Notre test de connexion

Notre test vérifie l'intégration entre :
- `LoginPage` (composant UI)
- `useAuthForm` (hook de gestion d'état)
- `signIn` (fonction d'API Supabase)

### Ce qu'on teste :
1. ✅ Rendu initial du formulaire
2. ✅ Saisie utilisateur et mise à jour d'état
3. ✅ Soumission et appel API
4. ✅ Gestion des états loading/erreur/succès
5. ✅ Affichage des messages utilisateur

## 🎯 Stratégies de Mocking en intégration

### ✅ Ce qu'il FAUT mocker :
- **APIs externes** (Supabase, services tiers)
- **Router Next.js** (pour éviter la navigation réelle)
- **Services externes** (email, storage, etc.)

### ❌ Ce qu'il NE FAUT PAS mocker :
- **Vos composants React** (on veut tester leur intégration)
- **Vos hooks personnalisés** (partie de l'intégration)
- **Votre logique métier** (c'est ce qu'on teste)

## 🔧 Techniques importantes

### 1. Gestion de l'asynchrone
```tsx
// ❌ Mauvais : ne teste pas l'état loading
await user.click(submitButton)
expect(mockAPI).toHaveBeenCalled()

// ✅ Bon : teste l'état loading avec délai
mockAPI.mockImplementation(() => 
  new Promise(resolve => setTimeout(resolve, 100))
)
await user.click(submitButton)
await waitFor(() => expect(button).toBeDisabled())
```

### 2. Interactions utilisateur réalistes
```tsx
// ❌ Moins réaliste
fireEvent.change(input, { target: { value: 'test' } })

// ✅ Plus réaliste (simule focus, blur, etc.)
await user.type(input, 'test')
```

### 3. Vérifications multiples
```tsx
// Vérifiez TOUS les aspects de l'intégration :
expect(mockAPI).toHaveBeenCalledWith(expectedParams) // API
expect(screen.getByText('Success')).toBeInTheDocument() // UI
expect(button).not.toBeDisabled() // État
```

## 🚀 Commandes utiles

```bash
# Exécuter tous les tests d'intégration
npm run test:integration

# Exécuter les tests unitaires
npm run test:unit

# Exécuter un test spécifique
npm test -- LoginFlow.test.tsx

# Mode watch pour développement
npm run test:watch
```

## 🎯 Prochaines étapes pour vous

1. **Analyser votre app** : Identifiez 2-3 flux utilisateur critiques
2. **Créer des tests d'intégration** pour ces flux (inscription, navigation, etc.)
3. **Équilibrer** : 70% tests unitaires, 20% intégration, 10% E2E
4. **Itérer** : Ajoutez des tests quand vous trouvez des bugs

## 📚 Ressources supplémentaires

- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [Kent C. Dodds - Testing Blog](https://kentcdodds.com/blog/testing)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)

---

**Conseil** : Commencez petit ! Un test d'intégration bien fait vaut mieux que 10 tests mal conçus. 🎯 