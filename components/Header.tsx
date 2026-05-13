import Image from "next/image"
import React from "react"

const Header = () => {
	return (
		<header className="sticky top-0 z-50 flex h-[50px] w-full items-center bg-zinc-900">
			<Image
				src="/AirCast.png"
				alt="AirCast"
				width={140}
				height={40}
				className="ml-4 h-10 w-auto object-contain object-left brightness-0 invert"
				priority
			/>
		</header>
	)
}

export default Header