import { useContext } from "react"
import { DialogContext } from "../contexts/DialogContext"

export const useDialog = () => useContext(DialogContext)
