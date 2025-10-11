"use client"
import Image from 'next/image'

export default function IconPeopleImg({ className = '', alt = 'Personnes' }: { className?: string; alt?: string }) {
  // Use the public path so Next serves it from /public/icons/iconPeople.png
  return <Image src="/icons/iconPeople.png" alt={alt} width={20} height={20} className={className} />
}
