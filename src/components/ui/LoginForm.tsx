'use client'
import { useState } from 'react'
import { TextInput } from './TextInput'
import { PrimaryButton } from './PrimaryButton'

export default function LoginForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // placeholder - replace with actual auth call
    console.log('login', { identifier, password, remember })
    alert('Tentative de connexion (mock)')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <h2 className="text-2xl font-bold mb-2">Connexion</h2>
  <p className="text-sm text-foreground mb-6">Saisissez vos identifiants pour accéder à votre compte.</p>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Identifiant <span className="text-error">*</span></label>
        <TextInput placeholder="Placeholder" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Mot de passe <span className="text-error">*</span></label>
        <TextInput placeholder="Placeholder" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input id="remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4" />
  <label htmlFor="remember" className="text-sm text-foreground">Se souvenir de mon mot de passe</label>
      </div>

  <PrimaryButton label="Connexion" withIcons={false} />
    </form>
  )
}
