import React from "react"
import { Trans } from "react-i18next"
import CommitHash from "virtual:commit-hash"

const otherProducts = [
  {
    name: "SplenPlayer",
    url: "https://splenplayer.com",
  },
  {
    name: "txtpad.io",
    url: "https://txtpad.io",
  },
  {
    name: "SplenView",
    url: "https://splenview.com",
  }
]

const Footer: React.FC = () => {
  const randomProduct =
    otherProducts[Math.floor(Math.random() * otherProducts.length)]
  return (
    <footer className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900">
      <div className="mx-8 flex h-16 items-center justify-center md:mx-16">
        <div className="hidden flex-1 sm:block"></div>
        <p className="text-sm text-black dark:text-white">
          <Trans
            i18nKey="footer.checkOutProduct"
            components={{
              link: (
                <a
                  key="random-product-link"
                  href={randomProduct.url}
                  target="_blank"
                  className="underline focus:outline-pink-900 dark:focus:outline-pink-700"
                >
                  {randomProduct.name}
                </a>
              ),
            }}
          />
        </p>
        <div className="hidden flex-1 text-right text-sm text-white sm:block dark:text-neutral-900">
          Version {APP_VERSION}.{CommitHash.substring(0, 7)}
        </div>
      </div>
    </footer>
  )
}

export default Footer
