import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function PostIt({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative transform rotate-1 hover:rotate-0 transition-transform duration-200 shadow-lg min-h-[60px] max-w-[300px]">
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md z-10">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <img className="w-4 h-4" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADUklEQVR4nO2ZS0tVURTHz6VJUT5GRQllD7WuZPYaRDaoL+CjJg3SJlEYNbGZFD2N+gA2iZJeX8BBQYRS0aTIBt2yYfSga2qgYEbhLzbug4vt8Z697z37KuIfLlzOXuu//mufc9Zee58gWKwANgBlC0BHGbDe1ekk0xgCdnlTFwMVW2tQOOHi2MMMRoDaoMgAanXsEHddnNOG80NLvzrgPPAUyACj+pfR19RYnSXXI2MS09YJiNuX1QRnYmybtEhbvAcaYzjPatsfwE4n8YKkHKjOMV4JvCR/PM/1ggI13goJ0CDuUIhR/f606MewXP/S+lqPtpHIAvu9iMwh/gAwKURMAF02s6UTug78Fv6Kq6GY64Oc+W/A3jx46oHPgmcY2ORH9UzQFPBKBP0CVBTAV6E5QrxIVvHsgEeMx6bgRY7paqe4QjQnozZ69gdFoCsJcl8VvB+S4o2aKbmwlCbc74wI/vqkuGWQyyLAbQ/8dwT/RRfHLqOkqf/XIuz6hE2jhwSaBf8za53AOLMxHkHwSYxXe0igRvAPRrx/0TpVFpZ3YEzYlHhIoETwj0WMW+nMFeCP5wRKBf9k4CGA6gpDbPXAv03wfw88BFCdY4gmD/wtgr8/8BDgkgjQ44H/nuC/EHgIsEMEGPWwkP0S/NuT4jYDfRRBbiTIe1PwZpLijQp0WFYKYHcCnHuMvYWfZk4E7JfVQu0PCmynvwq+vqTFqt1TpXFtszirUXgLLM+DewUwIHiGzA0NsDHvPbE6CRBCTxlj+4we3r75iq5qE4rTGG/XY1nnU4mIQ6VZZRM4LsbV1jDlwJ8ytpNtMWXV7XANeBB3qAQs0/vYEFUO/FXCb1hxRdikDf77LgmcBqZ0+zDnthHoFQFaHfhbhV9vzGOc1VrarRMQs5TzBQI6hZBuB+5u4ddpschZ310nAIeEkAEHv3fC76AXcZZCVgJ/tZB/wCofPl5hzKYrBvyqs0vgVgEJdM+3frOiuOLYfOuPqumpmAXsp7DfUly1c4uSvdGcJU+dZgg7lYj16u0VxoLWlsOuzWYBKzqAc0LYa2BthM064I2w6wgWCoA1xqYkDsp2dbCQABzVPUscplz6pqJCfzd7YrTiIdS1x0X/HraEJSxy/AcqRQlRiRcHcwAAAABJRU5ErkJggg==" alt="light-on--v1"/>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>This aims to help your employees to fill the template form during template generation</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="bg-yellow-200 border-l-4 border-yellow-400 rounded-lg">
                {children}
            </div>
        </div>
    )
}