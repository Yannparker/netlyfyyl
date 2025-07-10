"use client"
import { getTicketsByIds } from '@/app/actions'
// ❌ Supprimer les imports inutilisés
// import EmptyState from '@/app/components/EmptyState'

import TicketComponent from '@/app/components/TicketComponent'
import { Ticket } from '@/type'
import React, { useEffect, useState, useCallback } from 'react'

const Page = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketNums, setTicketNums] = useState<string[]>([])
  const [countdown, setCountdown] = useState<number>(5)
//  Correction ESLint test

  // Stabiliser la fonction
  const fetchTickets = useCallback(async () => {
    const stored = localStorage.getItem('ticketNums')
    if (stored && stored !== "undefined") {
      const parsed = JSON.parse(stored)
      setTicketNums(parsed)
      const fetched = await getTicketsByIds(parsed)
      const valid = fetched?.filter(t => t.status !== "FINISHED") || []
      const validNums = valid.map(t => t.num)
      localStorage.setItem('ticketNums', JSON.stringify(validNums))
      setTickets(valid)
    } else {
      setTicketNums([])
    }
  }, [])

  //  useEffect avec dépendance propre
  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    const countdownHandler = () => {
      if (countdown === 0) {
        if (ticketNums.length > 0) fetchTickets()
        setCountdown(5)
      } else {
        setCountdown(prev => prev - 1)
      }
    }
    const timer = setTimeout(countdownHandler, 1000)
    return () => clearTimeout(timer)
  }, [countdown, ticketNums, fetchTickets])

  return (
    <div className="px-5 md:px-[10%] mt-8 mb-10">
      {tickets.length > 0 ? (
        <div>
          <div className="flex justify-between mb-4">
            <h1 className="text-2xl font-bold">Vos Tickets</h1>
            <div className="flex items-center">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-accent" />
              </span>
              <div className="ml-2">({countdown}s)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket, index) => {
              const totalWaitTime = tickets
                .slice(0, index)
                .reduce((acc, t) => acc + t.avgTime, 0)
              return (
                <TicketComponent
                  key={ticket.id}
                  ticket={ticket}
                  totalWaitTime={totalWaitTime}
                 
                />
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-8">
          Aucun ticket actif
        </div>
      )}
    </div>
  )
}

export default Page
