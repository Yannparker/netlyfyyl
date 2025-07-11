"use client"
import { createTicket, getServicesByPageName, getTicketsByIds } from '@/app/actions'
import TicketComponent from '@/app/components/TicketComponent'
import { Ticket } from '@/type'
import { Service } from '@prisma/client'
import React, { useEffect, useState } from 'react'

export default function Page({ params }: { params: { pageName: string } }) {
  const pageName = params.pageName

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [nameComplete, setNameComplete] = useState<string>("")
  const [ticketNums, setTicketNums] = useState<string[]>([])
  const [countdown, setCountdown] = useState<number>(5)

  useEffect(() => {
    const fetchServicesAndTickets = async () => {
      try {
        const servicesList = await getServicesByPageName(pageName)
        if (servicesList) setServices(servicesList)

        const stored = localStorage.getItem('ticketNums')
        if (stored && stored !== "undefined") {
          const parsed = JSON.parse(stored)
          setTicketNums(parsed)

          if (parsed.length > 0) {
            const fetched = await getTicketsByIds(parsed)
            const valid = fetched?.filter(t => t.status !== "FINISHED") || []
            const validNums = valid.map(t => t.num)
            localStorage.setItem('ticketNums', JSON.stringify(validNums))
            setTickets(valid)
          }
        } else {
          setTicketNums([])
        }
      } catch (error) {
        console.error(error)
      }
    }

    fetchServicesAndTickets()
  }, [pageName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServiceId || !nameComplete) {
      alert("Veuillez sélectionner un service et entrer votre nom.")
      return
    }
    try {
      const ticketNum = await createTicket(selectedServiceId, nameComplete, pageName)
      if (ticketNum) {
        const updated = [...ticketNums, ticketNum]
        setTicketNums(updated)
        localStorage.setItem("ticketNums", JSON.stringify(updated))
      }
      setSelectedServiceId(null)
      setNameComplete("")
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    const countdownHandler = async () => {
      if (countdown === 0) {
        if (ticketNums.length > 0) {
          try {
            const fetched = await getTicketsByIds(ticketNums)
            const valid = fetched?.filter(t => t.status !== "FINISHED") || []
            const validNums = valid.map(t => t.num)
            localStorage.setItem('ticketNums', JSON.stringify(validNums))
            setTickets(valid)
          } catch (error) {
            console.error(error)
          }
        }
        setCountdown(5)
      } else {
        setCountdown(prev => prev - 1)
      }
    }

    const timer = setTimeout(countdownHandler, 1000)
    return () => clearTimeout(timer)
  }, [countdown, ticketNums])

  return (
    <div className='px-5 md:px-[10%] mt-8 mb-10'>
      <div>
        <h1 className='text-2xl font-bold'>
          Bienvenu sur <span className='badge badge-accent ml-2'>@{pageName}</span>
        </h1>
        <p className='text-md'>Aller , créer votre ticket</p>
      </div>

      <div className='flex flex-col md:flex-row w-full mt-4'>
        <form className='flex flex-col space-y-2 md:w-96' onSubmit={handleSubmit}>
          <select
            className="select select-bordered w-full"
            onChange={(e) => setSelectedServiceId(e.target.value)}
            value={selectedServiceId || ''}
          >
            <option disabled value="">Choisissez un service</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} - ({service.avgTime} min)
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder='Quel est votre nom ?'
            className='input input-bordered w-full'
            onChange={(e) => setNameComplete(e.target.value)}
            value={nameComplete}
          />
          <button type="submit" className='btn btn-accent w-fit'>Go</button>
        </form>

        <div className='w-full mt-4 md:ml-4 md:mt-0'>
          {tickets.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  )
}
