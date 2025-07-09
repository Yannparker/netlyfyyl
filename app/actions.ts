"use server"

import prisma from "@/lib/prisma"

export async function checkAndAddUser(email: string, name: string) {
  if (!email) return
  try {
    const existingUser = await prisma.company.findUnique({ where: { email } })
    if (!existingUser && name) {
      await prisma.company.create({ data: { email, name } })
    }
  } catch (error) {
    console.error(error)
  }
}

export async function createService(email: string, serviceName: string, avgTime: number) {
  if (!email || !serviceName || avgTime == null) return
  try {
    const existingCompany = await prisma.company.findUnique({ where: { email } })
    if (existingCompany) {
      await prisma.service.create({
        data: { name: serviceName, avgTime, companyId: existingCompany.id }
      })
    } else {
      console.log(`No company found with email: ${email}`)
    }
  } catch (error) {
    console.error(error)
  }
}

export async function getServicesByEmail(email: string) {
  if (!email) return
  try {
    const company = await prisma.company.findUnique({ where: { email } })
    if (!company) throw new Error("Aucune entreprise trouvée avec cet email")
    return await prisma.service.findMany({
      where: { companyId: company.id },
      include: { company: true }
    })
  } catch (error) {
    console.error(error)
  }
}

export async function deleteServiceById(serviceId: string) {
  if (!serviceId) return
  try {
    await prisma.service.delete({ where: { id: serviceId } })
  } catch (error) {
    console.error(error)
  }
}

export async function getCompanyPageName(email: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { email },
      select: { pageName: true }
    })
    return company?.pageName
  } catch (error) {
    console.error(error)
  }
}

export async function setCompanyPageName(email: string, pageName: string) {
  try {
    const company = await prisma.company.findUnique({ where: { email } })
    if (company) {
      await prisma.company.update({ where: { email }, data: { pageName } })
    }
  } catch (error) {
    console.error(error)
  }
}

export async function getServicesByPageName(pageName: string) {
  try {
    const company = await prisma.company.findUnique({ where: { pageName } })
    if (!company) throw new Error(`Aucune entreprise trouvée avec le nom de page : ${pageName}`)
    return await prisma.service.findMany({
      where: { companyId: company.id },
      include: { company: true }
    })
  } catch (error) {
    console.error(error)
  }
}

export async function createTicket(serviceId: string, nameComplete: string, pageName: string) {
  try {
    const company = await prisma.company.findUnique({ where: { pageName } })
    if (!company) throw new Error(`Aucune entreprise trouvée avec le nom de page : ${pageName}`)

    const ticketNum = `A${Math.floor(Math.random() * 10000)}`
    await prisma.ticket.create({
      data: {
        serviceId,
        nameComplete,
        num: ticketNum,
        status: "PENDING"
      }
    })

    return ticketNum
  } catch (error) {
    console.error(error)
  }
}

export async function getPendingTicketsByEmail(email: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { email },
      include: {
        services: {
          include: {
            tickets: {
              where: { status: { in: ["PENDING", "CALL", "IN_PROGRESS"] } },
              orderBy: { createdAt: "asc" },
              include: { post: true }
            }
          }
        }
      }
    })

    if (!company) throw new Error(`Aucune entreprise trouvée avec l'email : ${email}`)

    const pendingTickets = company.services.flatMap(service =>
      service.tickets.map(ticket => ({
        ...ticket,
        serviceName: service.name,
        avgTime: service.avgTime
      }))
    )

    return pendingTickets.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  } catch (error) {
    console.error(error)
  }
}

export async function getTicketsByIds(ticketNums: string[]) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { num: { in: ticketNums } },
      orderBy: { createdAt: "asc" },
      include: { service: true, post: true }
    })

    if (!tickets.length) throw new Error("Aucun ticket trouvé")

    return tickets.map(ticket => ({
      ...ticket,
      serviceName: ticket.service.name,
      avgTime: ticket.service.avgTime
    }))
  } catch (error) {
    console.error(error)
  }
}
export async function createPost(email: string, postName: string) {
    try {
      const company = await prisma.company.findUnique({ where: { email } })
      if (!company) throw new Error("Aucune entreprise trouvée avec cet email")
      await prisma.post.create({
        data: {
          name: postName,
          companyId: company.id
        }
      })
    } catch (error) {
      console.error(error)
    }
  }
  
  export async function deletePost(postId: string) {
    try {
      await prisma.post.delete({ where: { id: postId } })
    } catch (error) {
      console.error(error)
    }
  }
  
  export async function getPostsByCompanyEmail(email: string) {
    try {
      const company = await prisma.company.findUnique({ where: { email } })
      if (!company) throw new Error("Aucune entreprise trouvée avec cet email")
      return await prisma.post.findMany({
        where: { companyId: company.id },
        include: { company: true }
      })
    } catch (error) {
      console.error(error)
    }
  }
  
  export async function getPostNameById(postId: string) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { name: true }
      })
      return post?.name ?? null
    } catch (error) {
      console.error(error)
    }
  }
  
  export async function getLastTicketByEmail(email: string, idPoste: string) {
    try {
      const existing = await prisma.ticket.findFirst({
        where: {
          postId: idPoste,
          status: { in: ["CALL", "IN_PROGRESS"] }
        },
        orderBy: { createdAt: "desc" },
        include: { service: true, post: true }
      })
  
      if (existing?.service) {
        return {
          ...existing,
          serviceName: existing.service.name,
          avgTime: existing.service.avgTime
        }
      }
  
      const ticket = await prisma.ticket.findFirst({
        where: {
          status: "PENDING",
          service: { company: { email } }
        },
        orderBy: { createdAt: "desc" },
        include: { service: true, post: true }
      })
  
      if (!ticket?.service) return null
  
      const post = await prisma.post.findUnique({ where: { id: idPoste } })
      if (!post) return null
  
      const updated = await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "CALL",
          postId: post.id,
          postName: post.name
        },
        include: { service: true }
      })
  
      return {
        ...updated,
        serviceName: updated.service.name,
        avgTime: updated.service.avgTime
      }
    } catch (error) {
      console.error(error)
    }
  }
  
  export async function updateTicketStatus(
    ticketId: string,
    newStatus: "PENDING" | "CALL" | "IN_PROGRESS" | "FINISHED"
  ) {
    try {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: newStatus }
      })
    } catch (error) {
      console.error(error)
    }
  }
  
  export async function get10LstFinishedTicketsByEmail(email: string) {
    try {
      const tickets = await prisma.ticket.findMany({
        where: {
          status: "FINISHED",
          service: { company: { email } }
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { service: true, post: true }
      })
  
      return tickets.map(ticket => ({
        ...ticket,
        serviceName: ticket.service?.name,
        avgTime: ticket.service?.avgTime
      }))
    } catch (error) {
      console.error(error)
    }
  }
  
  export async function getTicketStatsByEmail(email: string) {
    try {
      const tickets = await prisma.ticket.findMany({
        where: { service: { company: { email } } }
      })
  
      const totalTickets = tickets.length
      const resolved = tickets.filter(t => t.status === "FINISHED").length
      const pending = tickets.filter(t => t.status === "PENDING").length
  
      return {
        totalTickets,
        resolvedTickets: resolved,
        pendingTickets: pending
      }
    } catch (error) {
      console.error(error)
      return {
        totalTickets: 0,
        resolvedTickets: 0,
        pendingTickets: 0
      }
    }
  }
  