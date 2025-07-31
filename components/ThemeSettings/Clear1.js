'use client'
import { useEffect } from 'react'

const ClearButton1 = () => {

    const clearLocalStorage = () => {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('toggled')
        }
    }

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const clear = () => {
                document.body.classList.remove('dark-theme')
                const themeLightInput = document.querySelector('.theme-dark-light .light input')
                if (themeLightInput) themeLightInput.checked = true
                
                const layoutWrap = document.querySelector('.layout-wrap')
                if (layoutWrap) {
                    layoutWrap.classList.remove('menu-style-icon', 'menu-style-icon-default')
                    layoutWrap.classList.remove('layout-width-boxed')
                    layoutWrap.classList.remove('menu-position-scrollable')
                    layoutWrap.classList.remove('header-position-scrollable')
                    layoutWrap.classList.remove('loader-off')
                }
                
                const menuClickInput = document.querySelector('.menu-style .menu-click')
                if (menuClickInput) menuClickInput.checked = true
                
                const layoutWidthFull = document.querySelector('.layout-width .full')
                if (layoutWidthFull) layoutWidthFull.checked = true
                
                const menuPositionFixed = document.querySelector('.menu-position .menu-fixed')
                if (menuPositionFixed) menuPositionFixed.checked = true
                
                const headerPositionFixed = document.querySelector('.header-position .header-fixed')
                if (headerPositionFixed) headerPositionFixed.checked = true
                
                const styleLoaderOn = document.querySelector('.style-loader .style-loader-on')
                if (styleLoaderOn) styleLoaderOn.checked = true
                
                clearLocalStorage()
            }

            const clearButton = document.querySelector('.form-theme-style .button-clear-select')
            // clearButton.addEventListener('click', clear)

            return () => {
                // clearButton.removeEventListener('click', clear)
            }
        }
    }, [])

    return null // As this component does not render anything visible
}

export default ClearButton1
