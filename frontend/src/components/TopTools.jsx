import { Calculator } from './Calculator.jsx'
import { DateDisplay } from './DateDisplay.jsx'
import { LanguageMenu } from './LanguageMenu.jsx'

export function TopTools() {
  return (
    <div className="corner-tools">
      <DateDisplay />
      <LanguageMenu />
      <Calculator />
    </div>
  )
}
