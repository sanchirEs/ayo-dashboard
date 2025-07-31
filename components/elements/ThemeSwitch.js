// components/ThemeSwitch.js
'use client'
import { useEffect, useState } from 'react'

const ThemeSwitch = ({ radioBtn }) => {
    const [theme, setTheme] = useState('light-theme')
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        const savedTheme = localStorage.getItem('theme') || 'light-theme'
        setTheme(savedTheme)
    }, [])

    const lightLogo = '/images/logo/logo.png'
    const darkLogo = '/images/logo/logo-dark.png'

    const toggleTheme = () => {
        const newTheme = theme === 'light-theme' ? 'dark-theme' : 'light-theme'
        setTheme(newTheme)
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('theme', newTheme)
        }
    }

    useEffect(() => {
        if (typeof document !== 'undefined' && isClient) {
            if (theme === 'dark-theme') {
                document.body.classList.add('dark-theme')
                document.body.classList.remove('light-theme')
            } else {
                document.body.classList.add('light-theme')
                document.body.classList.remove('dark-theme')
            }

            // Set logo when theme changes
            const logo = theme === 'dark-theme' ? darkLogo : lightLogo
            const logoHeader = document.getElementById('logo_header')
            const logoHeaderMobile = document.getElementById('logo_header_mobile')
            if (logoHeader) logoHeader.setAttribute('src', logo)
            if (logoHeaderMobile) logoHeaderMobile.setAttribute('src', logo)
        }
    }, [theme, isClient]) // Add theme and isClient as dependencies

    if (!isClient) {
        return null; // or a loading spinner
    }

    return (
        <>
            {!radioBtn ? (
                <div className="header-item button-dark-light" onClick={toggleTheme}>
                    <i className="icon-moon" />
                </div>
            ) : (
                <div className="radio-buttons">
                    <div className="item button-dark-light light">
                        <input type="radio" name="mode" id="mode1" defaultChecked={theme === 'light-theme'} onChange={toggleTheme} />
                        <label htmlFor="mode1">
                            <div className="body-title">Light</div>
                        </label>
                    </div>
                    <div className="item button-dark-light dark">
                        <input type="radio" name="mode" id="mode2" defaultChecked={theme === 'dark-theme'} onChange={toggleTheme} />
                        <label htmlFor="mode2">
                            <div className="body-title">Dark</div>
                        </label>
                    </div>
                </div>
            )}
        </>
    )
}

export default ThemeSwitch;


