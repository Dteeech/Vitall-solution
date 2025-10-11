import Image from 'next/image'
import LoginForm from '@/components/ui/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-6xl bg-white shadow-sm rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left artwork */}
  <div className="hidden md:flex bg-primary-softer p-8 items-center justify-start w-full">
          <div className="min-w-[520px] h-full max-w-xs">
            <Image src="/bg/bg-connexion.jpg" alt="Illustration" width={620} height={920} className="object-cover rounded-2xl w-full" />
          </div>
        </div>

        {/* Right form area */}
        <div className="p-10 flex flex-col justify-center">
          <div className="flex justify-end mb-6">
            <div className="text-right">
              <Image src="/logo-N&B.png" alt="Vitall" width={64} height={64} />
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
