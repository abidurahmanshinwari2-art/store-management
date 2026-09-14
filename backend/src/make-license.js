import { createLicenseKey } from './license.js'

const name = process.argv.slice(2).join(' ').trim()
if (!name) {
  console.log('Write the shop name after the command.')
  console.log('Example: make-license.bat "Hasan Shinwari General Store"')
  process.exit(1)
}

const key = createLicenseKey(name)
console.log('')
console.log('Shop: ' + name)
console.log('Key:  ' + key)
console.log('')
console.log('Give this shop name and key to the paying customer.')
console.log('They type both on the first open of the store.')
console.log('')
