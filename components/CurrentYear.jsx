'use client'

import { useState, useEffect } from 'react'

export default function CurrentYear() {
  const [year, setYear] = useState(2024) // fallback year

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return <span>{year}</span>
}
