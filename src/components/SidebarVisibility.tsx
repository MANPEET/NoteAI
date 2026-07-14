"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/Sidebar"  

type Props = React.ComponentProps<typeof AppSidebar>

export default function SidebarVisibility(props: Props) {
  const pathname = usePathname()
  if (pathname.startsWith("/boards/")) return null
  return <AppSidebar {...props} />
}