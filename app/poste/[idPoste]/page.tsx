"use client"
import { getPendingTicketsByEmail, getPostNameById } from '@/app/actions'
import EmptyState from '@/app/components/EmptyState'
import TicketComponent from '@/app/components/TicketComponent'
import Wrapper from '@/app/components/Wrapper'
import { Ticket } from '@/type'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

export default function Page({ params }: { params: { idPoste: string } }) {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [countdown, setCountdown] = useState<number>(5)
  const [idPoste, setIdPoste] = useState<string | null>(null)
  const [namePoste, setNamePoste] = useState<string | null>(null)

  const fetchTickets = async () => {
    if (email) {
      try {
        const fetchedTickets = await getPendingTicketsByEmail(email)
        if (fetchedTickets) setTickets(fetchedTickets)
      } catch (error) {
        console.error(error)
      }
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [email, fetchTickets])

  useEffect(() => {
    const handleCountdownAndRefresh = () => {
      if (countdown === 0) {
        fetchTickets()
        setCountdown(5)
      } else {
        setCountdown(prev => prev - 1)
      }
    }
    const timeoutId = setTimeout(handleCountdownAndRefresh, 1000)
    return () => clearTimeout(timeoutId)
  }, [countdown, fetchTickets])

  useEffect(() => {
    const getPosteName = async () => {
      try {
        setIdPoste(params.idPoste)
        const postName = await getPostNameById(params.idPoste)
        if (postName) setNamePoste(postName)
      } catch (error) {
        console.error(error)
      }
    }

    getPosteName()
  }, [params.idPoste])

  return (
    <Wrapper>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">
          <span>Poste</span>
          <span className='badge badge-accent'>{namePoste ?? "aucun poste"}</span>
        </h1>
        <div className="flex items-center">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-accent" />
          </span>
          <div className="ml-2">({countdown}s)</div>
          <Link
            href={`/call/${idPoste}`}
            className={`btn btn-sm ml-4 ${!namePoste && "btn-disabled"}`}
          >
            Appeler le suivant
          </Link>
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState message="Aucun ticket en attente" IconComponent="Bird" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tickets.map((ticket, index) => {
            const totalWaitTime = tickets
              .slice(0, index)
              .reduce((acc, prevTicket) => acc + prevTicket.avgTime, 0)
            return (
              <TicketComponent
                key={ticket.id}
                ticket={ticket}
                totalWaitTime={totalWaitTime}
              />
            )
          })}
        </div>
      )}
    </Wrapper>
  )
}
