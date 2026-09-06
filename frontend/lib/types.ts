export type Reminder = {
    id: number
    title: string
    description: string | null
    date: string
    time: string | null
    repeat: 'once' | 'daily' | 'weekly' | 'monthly'
    repeat_day: string | null
    person_name: string | null
    phone: string | null
    is_completed: number
    created: string
    snoozed_until: string | null 
  }
  
  export type Cash = {
    id: number
    date: string
    amount: number
    title:string
    density: 'calm' | 'moderate' | 'busy'
  }
  
  export type Payment = {
    id: number
    payment_name: string
    amount: number
    due_date: string | number
    category: string | null
    is_paid: number
  }
  
  export type Note = {
    id: number
    title: string
    content: string | null
    importance: 'critical'|"low"
    reminder_date: string | null
    created: string
  }
  
  export type Goal = {
    id: number
    goal_name: string
    target_amount: number
    current_amount: number
    end_date: string | null
    is_completed: number
    created: string
    description:string
    category:string
  }
  
  export type CustomerReview = {
    id: number
    note: string
    tag: 'positive' | 'negative' | 'suggestion'
    date: string | null
    created: string
  }
  
  export type Recipe = {
    id: number
    product_name: string
    ingredients: string
    preparation_note: string | null
    created: string
  }