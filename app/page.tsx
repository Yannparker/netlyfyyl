//  Correction ESLint test
"use client"
import Wrapper from "./components/Wrapper"
import { useUser } from "@clerk/nextjs"
import { getPendingTicketsByEmail } from "./actions"
import { useEffect, useState } from "react"
import { Ticket } from "@/type"
import EmptyState from "./components/EmptyState"
import TicketComponent from "./components/TicketComponent"

export default function Home() {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [countdown, setCountdown] = useState<number>(5)

  const fetchTickets = async () => {
    if (email) {
      try {
        const fetchedTickets = await getPendingTicketsByEmail(email)
        if (fetchedTickets) {
          setTickets(fetchedTickets)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [email])

  useEffect(() => {
    const handleCountdownAndRefresh = () => {
      if (countdown === 0) {
        fetchTickets()
        setCountdown(5)
      } else {
        setCountdown(prevCountdown => prevCountdown - 1)
      }
    }
    const timeoutId = setTimeout(handleCountdownAndRefresh, 1000)
    return () => clearTimeout(timeoutId)
  }, [countdown])

  return (
    <Wrapper>
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
