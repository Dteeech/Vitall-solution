import { createServerSupabaseClient } from '../supabase'
import { getCurrentUser } from '../auth'
import { AuditService } from './core'

export interface CreateCustomerData {
  name: string
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
  paymentTerms?: number
  metadata?: Record<string, any>
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  isActive?: boolean
}

export interface CreateInvoiceData {
  customerId?: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  notes?: string
  terms?: string
}

export interface InvoiceItemData {
  description: string
  quantity: number
  unitPriceCents: number
  taxRate?: number
}

export interface CreatePaymentData {
  invoiceId: string
  amountCents: number
  paymentDate: string
  paymentMethod?: string
  reference?: string
  notes?: string
}

export class AccountingService {
  static async getCustomers(filters?: {
    search?: string
    isActive?: boolean
    limit?: number
    offset?: number
  }) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    let query = supabase
      .from('accounting_customer')
      .select('*')
      .eq('organization_id', user.organizationId)

    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    // Pagination
    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    query = query.order('name', { ascending: true })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`)
    }

    return data || []
  }

  static async createCustomer(customerData: CreateCustomerData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    const insertData = {
      ...customerData,
      organization_id: user.organizationId,
      tax_number: customerData.taxNumber,
      payment_terms: customerData.paymentTerms || 30,
      metadata: customerData.metadata || {}
    }

    const { data, error } = await supabase
      .from('accounting_customer')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('create', 'accounting_customer', data.id, customerData)

    return data
  }

  static async getInvoices(filters?: {
    customerId?: string
    status?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  }) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    let query = supabase
      .from('accounting_invoice')
      .select(`
        *,
        customer:accounting_customer(name, email)
      `)
      .eq('organization_id', user.organizationId)

    // Apply filters
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%`)
    }

    if (filters?.dateFrom) {
      query = query.gte('issue_date', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('issue_date', filters.dateTo)
    }

    // Pagination
    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    query = query.order('issue_date', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`)
    }

    return data || []
  }

  static async getInvoice(id: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('accounting_invoice')
      .select(`
        *,
        customer:accounting_customer(*),
        items:accounting_invoice_item(*),
        payments:accounting_payment(*)
      `)
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch invoice: ${error.message}`)
    }

    return data
  }

  static async createInvoice(invoiceData: CreateInvoiceData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    const insertData = {
      ...invoiceData,
      organization_id: user.organizationId,
      customer_id: invoiceData.customerId,
      invoice_number: invoiceData.invoiceNumber,
      issue_date: invoiceData.issueDate,
      due_date: invoiceData.dueDate,
      created_by: user.id
    }

    const { data, error } = await supabase
      .from('accounting_invoice')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('create', 'accounting_invoice', data.id, invoiceData)

    return data
  }

  static async getAccountingStats() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const [
      { count: totalInvoices },
      { count: paidInvoices },
      { count: overdueInvoices },
      { data: invoiceAmounts }
    ] = await Promise.all([
      supabase
        .from('accounting_invoice')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId),
      supabase
        .from('accounting_invoice')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .eq('status', 'paid'),
      supabase
        .from('accounting_invoice')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .eq('status', 'overdue'),
      supabase
        .from('accounting_invoice')
        .select('total_cents, paid_amount_cents, status')
        .eq('organization_id', user.organizationId)
    ])

    const totalRevenue = (invoiceAmounts || []).reduce((sum, invoice) => 
      sum + invoice.paid_amount_cents, 0
    )

    const outstandingAmount = (invoiceAmounts || [])
      .filter(invoice => invoice.status !== 'paid')
      .reduce((sum, invoice) => sum + (invoice.total_cents - invoice.paid_amount_cents), 0)

    return {
      totalInvoices: totalInvoices || 0,
      paidInvoices: paidInvoices || 0,
      overdueInvoices: overdueInvoices || 0,
      totalRevenue,
      outstandingAmount,
      averageInvoiceValue: totalInvoices ? Math.round(totalRevenue / (paidInvoices || 1)) : 0
    }
  }

  // Utility functions
  static formatCurrency(cents: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency
    }).format(cents / 100)
  }

  static parseCurrency(value: string): number {
    return Math.round(parseFloat(value.replace(/[^\d.-]/g, '')) * 100)
  }
}