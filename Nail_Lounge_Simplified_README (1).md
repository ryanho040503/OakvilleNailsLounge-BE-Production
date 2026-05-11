# Nail Lounge Website – Simplified Frontend & Booking Instructions

## Project Goal

Build a modern, professional, user-friendly website for a Nail Lounge startup.

This project focuses on a **customer-facing landing page and booking experience**, not a full salon management dashboard.

Customers should be able to:

- Visit the website
- Learn about the Nail Lounge
- Browse services
- View staff or nail artists
- Choose a service
- Select a date and time
- Enter contact information
- Submit a booking request

Keep the project simple, maintainable, and college-student-friendly.

---

# 1. Project Scope

## In Scope

Build:

- Landing page
- Services section
- About section
- Staff / nail artists section
- Booking page or booking form
- Contact section
- Simple confirmation message after booking
- Supabase-ready data structure
- Basic routing
- Clean responsive design

## Out of Scope

Do **not** implement:

- Payment processing
- Revenue dashboard
- Reports
- Analytics visualization
- Charts
- Staff admin dashboard
- Complex calendar scheduling system
- Authentication unless needed later
- Full CRM/customer management
- Inventory management

The main goal is a clean website where users can book nail services.

---

# 2. Recommended Tech Stack

Use:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Node.js runtime through Next.js API routes or server actions
- Supabase for database compatibility
- React Hook Form
- Zod
- lucide-react
- shadcn/ui
- date-fns
- Sonner for toast messages

Next.js is recommended because it uses React for the frontend and can also run backend/server logic with Node.js.

Supabase works well with this stack.

---

# 3. Dependencies

Install project dependencies:

```bash
npm install next react react-dom typescript tailwindcss postcss autoprefixer tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react react-hook-form @hookform/resolvers zod date-fns sonner @supabase/supabase-js
```

Install dev dependencies:

```bash
npm install -D eslint eslint-config-next prettier prettier-plugin-tailwindcss
```

Install shadcn/ui:

```bash
npx shadcn@latest init
```

Suggested shadcn/ui components:

```bash
npx shadcn@latest add button card input label select dialog textarea badge calendar popover toast
```

---

# 4. Design Direction

Create a clean, modern, beauty-focused website.

The website should feel:

- Professional
- Calm
- Premium
- Friendly
- Easy to use
- Mobile-first

Use colors such as:

- Soft blush
- Rose
- Cream
- Champagne
- White
- Light beige
- Charcoal text
- Muted gold accent

Avoid a complicated admin-dashboard style.

This should feel like a real nail lounge website for customers.

---

# 5. Architecture: Simple MVC-Friendly Structure

Use a simple MVC-style pattern adapted for Next.js.

This keeps the project easy to explain and maintain.

## Model

Models define data types and database-related structure.

Use:

```txt
src/types/
src/data/
```

Examples:

```txt
src/types/service.ts
src/types/staff.ts
src/types/booking.ts
src/data/mockData.ts
```

## View

Views are pages and UI components.

Use:

```txt
src/app/
src/components/
```

Examples:

```txt
src/app/page.tsx
src/app/book/page.tsx
src/components/home/HeroSection.tsx
src/components/booking/BookingForm.tsx
```

## Controller

Controllers contain business logic.

Use:

```txt
src/controllers/
src/lib/
```

Examples:

```txt
src/controllers/bookingController.ts
src/controllers/serviceController.ts
src/lib/validators.ts
src/lib/supabaseClient.ts
```

Controllers should handle:

- Getting services
- Getting staff
- Validating booking data
- Creating booking requests
- Checking available time slots
- Formatting booking information

Keep the logic simple and readable.

---

# 6. Main Folder Structure

Use this structure:

```txt
src/
  app/
    layout.tsx
    page.tsx
    services/
      page.tsx
    book/
      page.tsx
    contact/
      page.tsx
    api/
      bookings/
        route.ts

  components/
    layout/
      Header.tsx
      Footer.tsx
      MobileNav.tsx

    home/
      HeroSection.tsx
      ServicesPreview.tsx
      AboutSection.tsx
      StaffPreview.tsx
      TestimonialsSection.tsx
      CallToAction.tsx

    services/
      ServiceCard.tsx
      ServiceList.tsx

    booking/
      BookingForm.tsx
      BookingConfirmation.tsx
      TimeSlotPicker.tsx

    contact/
      ContactSection.tsx

    ui/

  controllers/
    bookingController.ts
    serviceController.ts
    staffController.ts

  data/
    mockData.ts

  lib/
    supabaseClient.ts
    validators.ts
    formatters.ts

  types/
    booking.ts
    service.ts
    staff.ts
    customer.ts
```

---

# 7. Routing

Use Next.js App Router.

Routes:

```txt
/             → landing page
/services     → full services page
/book         → booking page
/contact      → contact page
/api/bookings → API route for booking submission
```

Keep routing simple.

---

# 8. Simplified Data Model

Use a simplified version of the original data model.

The original dimensional model can be simplified because this is now a customer-facing website, not a reporting dashboard.

## service

Represents nail services customers can book.

Fields:

```txt
id
name
category
description
duration_minutes
price
is_active
```

## staff

Represents nail technicians or artists.

Fields:

```txt
id
name
role
bio
image_url
is_active
```

## customer

Represents the customer submitting a booking.

Fields:

```txt
id
first_name
last_name
phone
email
created_at
```

## booking

Represents a booking request.

Fields:

```txt
id
customer_id
service_id
staff_id
appointment_date
appointment_time
status
notes
created_at
```

Booking statuses:

```txt
Pending
Confirmed
Cancelled
Completed
```

For the first version, new bookings should be saved as:

```txt
Pending
```

---

# 9. TypeScript Types

Create these files.

## src/types/service.ts

```ts
export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}
```

## src/types/staff.ts

```ts
export interface Staff {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url?: string;
  is_active: boolean;
}
```

## src/types/customer.ts

```ts
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  created_at: string;
}
```

## src/types/booking.ts

```ts
export type BookingStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed";

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  staff_id?: string;
  appointment_date: string;
  appointment_time: string;
  status: BookingStatus;
  notes?: string;
  created_at: string;
}
```

---

# 10. Supabase Compatibility

Use Supabase for future backend/database support.

Create:

```txt
src/lib/supabaseClient.ts
```

Example:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do not hardcode Supabase keys inside components.

---

# 11. Suggested Supabase Tables

Use these tables later in Supabase.

## services

```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  duration_minutes integer not null,
  price numeric(10, 2) not null,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);
```

## staff

```sql
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  bio text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);
```

## customers

```sql
create table customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  created_at timestamp with time zone default now()
);
```

## bookings

```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  service_id uuid references services(id),
  staff_id uuid references staff(id),
  appointment_date date not null,
  appointment_time time not null,
  status text default 'Pending',
  notes text,
  created_at timestamp with time zone default now()
);
```

---

# 12. Mock Data

For the first version, use mock data before connecting Supabase.

Save mock data in:

```txt
src/data/mockData.ts
```

Create:

```txt
mockServices
mockStaff
mockTimeSlots
```

Example services:

- Classic Manicure
- Gel Manicure
- Spa Pedicure
- Acrylic Full Set
- Nail Art
- Polish Removal

Example time slots:

```txt
10:00 AM
10:30 AM
11:00 AM
11:30 AM
12:00 PM
1:00 PM
1:30 PM
2:00 PM
2:30 PM
3:00 PM
3:30 PM
4:00 PM
```

---

# 13. Booking Flow

The booking flow should be simple.

## Step 1

Customer selects a service.

## Step 2

Customer selects a staff member.

Staff selection can be optional.

Add an option:

```txt
No preference
```

## Step 3

Customer selects appointment date.

## Step 4

Customer selects time slot.

## Step 5

Customer enters contact information.

Fields:

- First name
- Last name
- Phone
- Email
- Notes

## Step 6

Customer submits booking request.

Show success message:

```txt
Thank you! Your booking request has been received. We will contact you to confirm your appointment.
```

Do not collect payment.

---

# 14. Booking Validation

Use React Hook Form and Zod.

Required fields:

- Service
- Appointment date
- Appointment time
- First name
- Last name
- Phone
- Email

Optional fields:

- Staff
- Notes

Validation rules:

- Email must be valid
- Phone must not be empty
- Date must not be in the past
- Service must be active
- Time slot must be selected

---

# 15. API Route for Booking Submission

Create:

```txt
src/app/api/bookings/route.ts
```

This route should:

1. Receive booking form data
2. Validate required fields
3. Create or find customer
4. Create booking with status `Pending`
5. Return success or error response

For the first version, it can use mock behavior.

Later, connect it to Supabase.

Example response:

```ts
return Response.json({
  success: true,
  message: "Booking request received",
});
```

---

# 16. Pages to Build

## Landing Page

Route:

```txt
/
```

Sections:

- Header/navigation
- Hero section
- Services preview
- Why choose us
- About Nail Lounge
- Staff preview
- Testimonials
- Contact information
- Book now call-to-action
- Footer

Hero should include:

- Business name
- Short tagline
- Book Now button
- View Services button

Example tagline:

```txt
Beautiful nails, relaxing experience, effortless booking.
```

---

## Services Page

Route:

```txt
/services
```

Show:

- List of services
- Category filter
- Price
- Duration
- Description
- Book button for each service

Clicking Book should go to:

```txt
/book?serviceId=selected_service_id
```

---

## Booking Page

Route:

```txt
/book
```

Show:

- Booking form
- Selected service summary
- Staff selector
- Date picker
- Time slot picker
- Customer information fields
- Notes field
- Submit button
- Confirmation message

---

## Contact Page

Route:

```txt
/contact
```

Show:

- Address
- Phone
- Email
- Opening hours
- Simple contact section
- Book now button

Do not implement a complex contact form unless desired.

---

# 17. Reusable Components

Build these components:

```txt
Header
Footer
MobileNav
HeroSection
ServicesPreview
ServiceCard
ServiceList
AboutSection
StaffPreview
TestimonialsSection
CallToAction
BookingForm
TimeSlotPicker
BookingConfirmation
ContactSection
```

---

# 18. UI Requirements

The website must be:

- Mobile responsive
- Easy to navigate
- Fast to understand
- Friendly for customers
- Professional-looking
- Simple enough for a student project
- Consistent in spacing and typography

Use clear buttons:

- Book Now
- View Services
- Submit Booking Request
- Back to Home

---

# 19. Code Style Requirements

Use college-student-friendly code.

Rules:

- Use clear file names
- Keep components small
- Add simple comments where helpful
- Avoid complex design patterns
- Use TypeScript interfaces
- Keep form logic readable
- Keep business logic in controllers/lib
- Do not put all logic into one page file
- Use reusable components

Good example:

```txt
BookingForm.tsx displays the form
bookingController.ts handles booking logic
mockData.ts stores sample services and staff
booking.ts stores booking types
```

Bad example:

```txt
All booking form, mock data, validation, and submission logic inside page.tsx
```

---

# 20. Implementation Order

Build in this order:

1. Create Next.js project
2. Install dependencies
3. Set up Tailwind CSS
4. Set up shadcn/ui
5. Create folder structure
6. Create TypeScript types
7. Create mock data
8. Create layout, header, and footer
9. Build landing page
10. Build services page
11. Build booking form
12. Build booking page
13. Add validation
14. Add booking confirmation message
15. Create API route for booking submission
16. Add Supabase client setup
17. Keep Supabase optional until ready
18. Build contact page
19. Polish responsive design
20. Final cleanup

---

# 21. Acceptance Criteria

The final project should:

- Be a customer-facing Nail Lounge website
- Have a modern landing page
- Show services clearly
- Allow users to submit booking requests
- Not include payment
- Not include charts or reports
- Be compatible with Supabase
- Use simple routing
- Use TypeScript
- Use clean, maintainable code
- Use a simple MVC-style structure
- Be easy for a college student to explain

---

# 22. Prompt for Codex

Use this prompt:

```txt
Read README.md and build the simplified Nail Lounge customer website.

Focus only on:
- landing page
- services page
- booking page
- contact page
- simple booking request form

Do not build:
- payment
- reports
- dashboards
- charts
- admin management pages

Use:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Node.js through Next.js API routes or server actions
- Supabase-compatible structure

Use a simple MVC-style structure:
- Models in src/types and src/data
- Views in src/app and src/components
- Controllers in src/controllers and src/lib

Keep the code college-student-friendly:
- clear names
- small files
- helpful comments
- simple routing
- readable booking logic

Build the project in the implementation order listed in README.md.
```

---

# 23. Important Notes

Do not overbuild this project.

The first version should be simple:

- A beautiful landing page
- Service browsing
- A booking request form
- Supabase-ready code
- No payment
- No visualization
- No complex admin dashboard

Focus on the customer booking experience.
