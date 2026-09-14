import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createEmptyStore, looksLikeSample } from '../data/seed.js'
import { docTotals, lineTotals } from '../lib/calc.js'
import { fetchStore, pushStore } from '../utils/api.js'
import { round2, todayIso } from '../utils/format.js'
import { nextNumber, uid } from '../utils/id.js'
import { loadStore, saveStore } from '../utils/storage.js'

const StoreContext = createContext(null)

function ensureInventoryRow(db, productId, warehouseId) {
  let row = db.inventory.find((i) => i.productId === productId && i.warehouseId === warehouseId)
  if (!row) {
    row = { productId, warehouseId, qty: 0 }
    db.inventory.push(row)
  }
  return row
}

function adjustStock(db, { productId, warehouseId, qty, type, ref, date }) {
  const row = ensureInventoryRow(db, productId, warehouseId)
  const nextQty = round2(row.qty + qty)
  if (nextQty < 0) {
    throw new Error('Not enough stock for this movement.')
  }
  row.qty = nextQty
  db.movements.unshift({
    id: uid('mv-'),
    date: date || todayIso(),
    productId,
    warehouseId,
    qty,
    type,
    ref,
  })
}

function buildSaleItems(db, items) {
  return (items || []).map((item) => {
    const product = db.products.find((p) => p.id === item.productId)
    if (!product) throw new Error('A product on this bill was not found.')
    const qty = Number(item.qty) || 0
    if (qty < 0) throw new Error('Quantity cannot be negative.')
    return {
      productId: product.id,
      name: product.name,
      qty,
      listPrice: round2(item.listPrice ?? product.sellPrice),
      price: round2(item.price ?? product.sellPrice),
      discount: round2(item.discount || 0),
      taxable: product.taxable,
    }
  }).filter((item) => item.qty > 0)
}

function writeSaleTotals(sale, totals, paid) {
  sale.items = totals.lines
  sale.listGoods = totals.listGoods
  sale.billDiscount = totals.billDiscount
  sale.discount = totals.discount
  sale.subtotal = totals.subtotal
  sale.tax = totals.tax
  sale.total = totals.total
  sale.paid = paid
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => {
    const local = loadStore()
    if (local && !looksLikeSample(local)) return local
    return createEmptyStore()
  })
  const [ready, setReady] = useState(false)
  const skipSave = useRef(true)

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const remote = await fetchStore()
        if (!live) return
        if (remote && !looksLikeSample(remote)) {
          setDb(remote)
          saveStore(remote)
        } else {
          const local = loadStore()
          const next = local && !looksLikeSample(local) ? local : createEmptyStore()
          setDb(next)
          saveStore(next)
          await pushStore(next)
        }
      } catch {
        if (!live) return
        const local = loadStore()
        setDb(local && !looksLikeSample(local) ? local : createEmptyStore())
      } finally {
        if (live) {
          skipSave.current = false
          setReady(true)
        }
      }
    })()
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!ready || skipSave.current) return
    saveStore(db)
    const id = window.setTimeout(() => {
      pushStore(db).catch(() => {})
    }, 250)
    return () => window.clearTimeout(id)
  }, [db, ready])

  const taxRate = Number(db.company.taxRate) || 0
  const symbol = db.company.currencySymbol || '$'

  const getStock = (productId, warehouseId) => {
    if (warehouseId) {
      return db.inventory.find((i) => i.productId === productId && i.warehouseId === warehouseId)?.qty || 0
    }
    return db.inventory.filter((i) => i.productId === productId).reduce((sum, row) => sum + row.qty, 0)
  }

  const patch = (fn) => {
    setDb((prev) => {
      const next = structuredClone(prev)
      fn(next)
      return next
    })
  }

  const updateCompany = (fields) => patch((next) => { next.company = { ...next.company, ...fields } })

  const upsertList = (key, row) => {
    patch((next) => {
      const list = next[key]
      const idx = list.findIndex((item) => item.id === row.id)
      if (idx >= 0) list[idx] = { ...list[idx], ...row }
      else list.push(row)
    })
  }

  const removeFromList = (key, id) => {
    patch((next) => {
      next[key] = next[key].filter((item) => item.id !== id)
    })
  }

  const saveCategory = (row) => {
    const record = { id: row.id || uid('cat-'), name: row.name.trim() }
    if (!record.name) throw new Error('Category name is required.')
    upsertList('categories', record)
    return record
  }

  const deleteCategory = (id) => {
    if (db.products.some((p) => p.categoryId === id)) {
      throw new Error('This category is used by products. Move them first.')
    }
    removeFromList('categories', id)
  }

  const saveProduct = (row) => {
    const record = {
      id: row.id || uid('p-'),
      name: row.name.trim(),
      sku: row.sku.trim(),
      barcode: row.barcode.trim(),
      categoryId: row.categoryId,
      unit: row.unit.trim() || 'pcs',
      costPrice: round2(row.costPrice),
      sellPrice: round2(row.sellPrice),
      reorderLevel: Number(row.reorderLevel) || 0,
      taxable: Boolean(row.taxable),
    }
    if (!record.name) throw new Error('Product name is required.')
    if (!record.sku) throw new Error('SKU is required.')
    const skuTaken = db.products.some((p) => p.sku.toLowerCase() === record.sku.toLowerCase() && p.id !== record.id)
    if (skuTaken) throw new Error('That SKU is already used.')
    patch((next) => {
      const idx = next.products.findIndex((p) => p.id === record.id)
      if (idx >= 0) next.products[idx] = record
      else {
        next.products.push(record)
        next.warehouses.forEach((wh) => ensureInventoryRow(next, record.id, wh.id))
      }
    })
    return record
  }

  const deleteProduct = (id) => {
    if (getStock(id) !== 0) throw new Error('Stock must be zero before deleting a product.')
    patch((next) => {
      next.products = next.products.filter((p) => p.id !== id)
      next.inventory = next.inventory.filter((i) => i.productId !== id)
    })
  }

  const saveWarehouse = (row) => {
    const record = { id: row.id || uid('wh-'), name: row.name.trim(), address: row.address?.trim() || '' }
    if (!record.name) throw new Error('Warehouse name is required.')
    patch((next) => {
      const idx = next.warehouses.findIndex((w) => w.id === record.id)
      if (idx >= 0) next.warehouses[idx] = record
      else {
        next.warehouses.push(record)
        next.products.forEach((p) => ensureInventoryRow(next, p.id, record.id))
      }
    })
    return record
  }

  const saveParty = (key, row) => {
    const record = {
      id: row.id || uid(key === 'customers' ? 'c-' : 'sup-'),
      name: row.name.trim(),
      phone: row.phone?.trim() || '',
      email: row.email?.trim() || '',
      address: row.address?.trim() || '',
      balance: round2(row.balance ?? (row.id ? db[key].find((x) => x.id === row.id)?.balance : 0) ?? 0),
      ...(key === 'customers'
        ? { creditLimit: round2(row.creditLimit || 0), isWalkIn: Boolean(row.isWalkIn) }
        : {}),
    }
    if (!record.name) throw new Error('Name is required.')
    upsertList(key, record)
    return record
  }

  const saveUser = (row) => {
    const record = {
      id: row.id || uid('u-'),
      name: row.name.trim(),
      email: row.email.trim().toLowerCase(),
      password: row.password,
      role: row.role,
      active: row.active !== false,
    }
    if (!record.name || !record.email || !record.password) throw new Error('Name, email and password are required.')
    const taken = db.users.some((u) => u.email === record.email && u.id !== record.id)
    if (taken) throw new Error('That email is already used.')
    upsertList('users', record)
    return record
  }

  const createSale = (payload, userId) => {
    let created
    let error
    setDb((prev) => {
      try {
        const next = structuredClone(prev)
        const rate = Number(next.company.taxRate) || 0
        const items = buildSaleItems(next, payload.items)
        if (!items.length) throw new Error('Add at least one item.')
        items.forEach((item) => {
          const onHand = next.inventory.find(
            (row) => row.productId === item.productId && row.warehouseId === payload.warehouseId,
          )?.qty || 0
          if (onHand < item.qty) {
            throw new Error(`${item.name} has only ${onHand} in this warehouse.`)
          }
        })
        const totals = docTotals(items, rate, payload.billDiscount)
        const paid = round2(payload.paid ?? totals.total)
        if (paid > totals.total + 0.001) throw new Error('Paid amount cannot exceed the bill total.')
        items.forEach((item) => {
          adjustStock(next, {
            productId: item.productId,
            warehouseId: payload.warehouseId,
            qty: -item.qty,
            type: 'sale',
            ref: 'pending',
          })
        })
        const sale = {
          id: uid('s-'),
          number: nextNumber(next.sales, 'number', next.company.invoicePrefix || 'INV'),
          date: payload.date || todayIso(),
          customerId: payload.customerId || 'walkin',
          warehouseId: payload.warehouseId,
          paymentMethod: payload.paymentMethod || 'cash',
          status: 'completed',
          note: payload.note || '',
          userId,
          returns: [],
        }
        writeSaleTotals(sale, totals, paid)
        next.movements.forEach((m) => {
          if (m.ref === 'pending') m.ref = sale.number
        })
        const due = round2(sale.total - sale.paid)
        if (due > 0) {
          const customer = next.customers.find((c) => c.id === sale.customerId)
          if (!customer || customer.isWalkIn) throw new Error('Credit sales need a named customer.')
          customer.balance = round2(customer.balance + due)
        }
        next.sales.unshift(sale)
        next.holds = next.holds.filter((h) => h.id !== payload.holdId)
        created = sale
        return next
      } catch (err) {
        error = err
        return prev
      }
    })
    if (error) throw error
    return created
  }

  const applySaleChange = (next, sale, payload, userId) => {
    if (!sale || sale.status === 'returned') throw new Error('This sale cannot be changed.')
    const oldItems = sale.items || []
    const newItems = buildSaleItems(next, payload.items)
    const oldDue = round2(sale.total - sale.paid)
    const qtyByProduct = (list) => {
      const map = new Map()
      list.forEach((line) => {
        map.set(line.productId, (map.get(line.productId) || 0) + (Number(line.qty) || 0))
      })
      return map
    }
    const before = qtyByProduct(oldItems)
    const after = qtyByProduct(newItems)
    const ids = new Set([...before.keys(), ...after.keys()])
    ids.forEach((productId) => {
      const delta = (after.get(productId) || 0) - (before.get(productId) || 0)
      if (!delta) return
      adjustStock(next, {
        productId,
        warehouseId: sale.warehouseId,
        qty: -delta,
        type: delta < 0 ? 'return' : 'sale',
        ref: sale.number,
      })
    })
    const totals = docTotals(newItems, Number(next.company.taxRate) || 0, payload.billDiscount)
    let paid = payload.paid != null ? round2(payload.paid) : sale.paid
    if (paid > totals.total + 0.001) paid = totals.total
    const newDue = round2(totals.total - paid)
    const customer = next.customers.find((c) => c.id === sale.customerId)
    if (newDue > 0 && (!customer || customer.isWalkIn)) {
      throw new Error('Credit sales need a named customer.')
    }
    if (customer && !customer.isWalkIn) {
      customer.balance = round2(Math.max(0, customer.balance + (newDue - oldDue)))
    }
    const returnedLines = oldItems.map((line) => {
      const left = after.get(line.productId) || 0
      const take = Math.max(0, line.qty - left)
      return take > 0 ? { productId: line.productId, name: line.name, qty: take } : null
    }).filter(Boolean)
    if (returnedLines.length) {
      sale.returns = [...(sale.returns || []), {
        date: todayIso(),
        userId,
        items: returnedLines,
      }]
    }
    writeSaleTotals(sale, totals, paid)
    if (payload.note != null) sale.note = payload.note
    sale.editedAt = todayIso()
    sale.editedBy = userId
    if (!totals.lines.length) {
      sale.status = 'returned'
      sale.returnedAt = todayIso()
      sale.returnedBy = userId
    } else {
      sale.status = 'completed'
    }
    return sale
  }

  const updateSale = (saleId, payload, userId) => {
    let updated
    let error
    setDb((prev) => {
      try {
        const next = structuredClone(prev)
        const sale = next.sales.find((s) => s.id === saleId)
        updated = applySaleChange(next, sale, payload, userId)
        return next
      } catch (err) {
        error = err
        return prev
      }
    })
    if (error) throw error
    return updated
  }

  const returnSaleItems = (saleId, returns, userId) => {
    const sale = db.sales.find((s) => s.id === saleId)
    if (!sale) throw new Error('This sale cannot be returned.')
    const take = new Map((returns || []).map((row) => [row.productId, Math.max(0, Number(row.qty) || 0)]))
    const items = (sale.items || []).map((line) => ({
      ...line,
      qty: Math.max(0, line.qty - (take.get(line.productId) || 0)),
    }))
    return updateSale(saleId, {
      items,
      billDiscount: sale.billDiscount,
      note: sale.note,
    }, userId)
  }

  const returnSale = (saleId, userId) => {
    const sale = db.sales.find((s) => s.id === saleId)
    if (!sale) throw new Error('This sale cannot be returned.')
    return returnSaleItems(saleId, (sale.items || []).map((line) => ({
      productId: line.productId,
      qty: line.qty,
    })), userId)
  }

  const createPurchase = (payload, userId) => {
    let created
    setDb((prev) => {
      const next = structuredClone(prev)
      const rate = Number(next.company.taxRate) || 0
      const items = payload.items.map((item) => {
        const product = next.products.find((p) => p.id === item.productId)
        if (!product) throw new Error('A product on this purchase was not found.')
        const qty = Number(item.qty)
        const cost = round2(item.cost ?? product.costPrice)
        const { subtotal, tax, total } = lineTotals({ qty, price: cost, discount: 0, taxable: product.taxable }, rate)
        return { productId: product.id, name: product.name, qty, cost, taxable: product.taxable, subtotal, tax, total }
      })
      if (!items.length) throw new Error('Add at least one item.')
      const subtotal = round2(items.reduce((s, i) => s + i.subtotal, 0))
      const tax = round2(items.reduce((s, i) => s + i.tax, 0))
      const total = round2(subtotal + tax)
      const paid = round2(payload.paid ?? 0)
      const status = payload.status || 'received'
      const purchase = {
        id: uid('po-'),
        number: nextNumber(next.purchases, 'number', next.company.purchasePrefix || 'PO'),
        date: payload.date || todayIso(),
        supplierId: payload.supplierId,
        warehouseId: payload.warehouseId,
        items,
        subtotal,
        tax,
        total,
        paid,
        status,
        note: payload.note || '',
        userId,
      }
      if (status === 'received') {
        items.forEach((item) => {
          adjustStock(next, {
            productId: item.productId,
            warehouseId: purchase.warehouseId,
            qty: item.qty,
            type: 'purchase',
            ref: purchase.number,
          })
          const product = next.products.find((p) => p.id === item.productId)
          if (product) product.costPrice = item.cost
        })
        const due = round2(total - paid)
        const supplier = next.suppliers.find((s) => s.id === purchase.supplierId)
        if (supplier) supplier.balance = round2(supplier.balance + due)
      }
      next.purchases.unshift(purchase)
      created = purchase
      return next
    })
    return created
  }

  const receivePurchase = (purchaseId) => {
    setDb((prev) => {
      const next = structuredClone(prev)
      const purchase = next.purchases.find((p) => p.id === purchaseId)
      if (!purchase || purchase.status !== 'draft') throw new Error('Only draft purchases can be received.')
      purchase.items.forEach((item) => {
        adjustStock(next, {
          productId: item.productId,
          warehouseId: purchase.warehouseId,
          qty: item.qty,
          type: 'purchase',
          ref: purchase.number,
        })
        const product = next.products.find((p) => p.id === item.productId)
        if (product) product.costPrice = item.cost
      })
      const due = round2(purchase.total - purchase.paid)
      const supplier = next.suppliers.find((s) => s.id === purchase.supplierId)
      if (supplier) supplier.balance = round2(supplier.balance + due)
      purchase.status = 'received'
      return next
    })
  }

  const adjustInventory = ({ productId, warehouseId, qty, note, userId }) => {
    const delta = Number(qty)
    if (!delta) throw new Error('Enter a quantity to add or remove.')
    patch((next) => {
      adjustStock(next, {
        productId,
        warehouseId,
        qty: delta,
        type: 'adjust',
        ref: note || 'Manual adjust',
        date: todayIso(),
      })
      next.movements[0].userId = userId
    })
  }

  const transferStock = ({ productId, fromId, toId, qty, userId }) => {
    const amount = Number(qty)
    if (fromId === toId) throw new Error('Choose two different warehouses.')
    if (amount <= 0) throw new Error('Transfer quantity must be greater than zero.')
    patch((next) => {
      adjustStock(next, { productId, warehouseId: fromId, qty: -amount, type: 'transfer-out', ref: `to ${toId}` })
      adjustStock(next, { productId, warehouseId: toId, qty: amount, type: 'transfer-in', ref: `from ${fromId}` })
      next.movements[0].userId = userId
      next.movements[1].userId = userId
    })
  }

  const saveExpense = (row, userId) => {
    const record = {
      id: row.id || uid('e-'),
      date: row.date || todayIso(),
      category: row.category.trim(),
      amount: round2(row.amount),
      method: row.method || 'cash',
      note: row.note?.trim() || '',
      userId,
    }
    if (!record.category) throw new Error('Expense category is required.')
    if (record.amount <= 0) throw new Error('Amount must be greater than zero.')
    upsertList('expenses', record)
    return record
  }

  const recordPayment = (payload, userId) => {
    const amount = round2(payload.amount)
    if (amount <= 0) throw new Error('Amount must be greater than zero.')
    const record = {
      id: uid('pay-'),
      date: payload.date || todayIso(),
      type: payload.type,
      partyType: payload.partyType,
      partyId: payload.partyId,
      amount,
      method: payload.method || 'cash',
      note: payload.note?.trim() || '',
      userId,
    }
    patch((next) => {
      next.payments.unshift(record)
      if (record.partyType === 'customer') {
        const customer = next.customers.find((c) => c.id === record.partyId)
        if (!customer) throw new Error('Customer not found.')
        customer.balance = round2(Math.max(0, customer.balance - amount))
        let left = amount
        next.sales
          .filter((s) => s.customerId === record.partyId && s.status === 'completed')
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .forEach((sale) => {
            const due = round2(sale.total - sale.paid)
            if (left <= 0 || due <= 0) return
            const cut = Math.min(due, left)
            sale.paid = round2(sale.paid + cut)
            if (sale.paid >= sale.total) sale.paymentMethod = sale.paymentMethod === 'credit' ? 'cash' : sale.paymentMethod
            left = round2(left - cut)
          })
      } else {
        const supplier = next.suppliers.find((s) => s.id === record.partyId)
        if (!supplier) throw new Error('Supplier not found.')
        supplier.balance = round2(Math.max(0, supplier.balance - amount))
      }
    })
    return record
  }

  const attachBillByNumber = (number, customerId, loanAmount) => {
    const code = String(number || '').trim().toLowerCase()
    if (!code) throw new Error('Write a bill number.')
    const hasFixed = loanAmount !== undefined && loanAmount !== null && String(loanAmount).trim() !== ''
    let result
    let error
    setDb((prev) => {
      try {
        const next = structuredClone(prev)
        const sale = next.sales.find((s) => String(s.number).trim().toLowerCase() === code)
        if (!sale) throw new Error('Bill not found.')
        if (sale.status !== 'completed') throw new Error('This bill cannot go on loan.')
        const oldDue = round2(sale.total - sale.paid)
        const customer = next.customers.find((c) => c.id === customerId)
        if (!customer || customer.isWalkIn) throw new Error('Credit sales need a named customer.')

        let amount
        if (hasFixed) {
          amount = round2(loanAmount)
          if (amount <= 0) throw new Error('Write a money amount.')
          if (amount > sale.total + 0.001) throw new Error('That is more than the bill total.')
          if (sale.paid > 0 && amount >= sale.total - 0.001) {
            throw new Error('This bill is partly paid. You cannot add the whole bill.')
          }
        } else {
          if (oldDue <= 0) throw new Error('This bill is already paid.')
          amount = oldDue
        }

        const sameCustomer = sale.customerId === customerId
        if (!hasFixed && sameCustomer) {
          sale.loaned = true
          result = { sale, added: 0, already: true }
          return next
        }

        const newPaid = round2(sale.total - amount)
        const deltaDue = round2(amount - oldDue)

        if (sameCustomer) {
          if (Math.abs(deltaDue) < 0.001) {
            sale.loaned = true
            result = { sale, added: 0, already: true }
            return next
          }
          customer.balance = round2(Math.max(0, customer.balance + deltaDue))
          sale.paid = newPaid
          sale.loaned = true
          result = { sale, added: deltaDue, already: false }
          return next
        }

        const old = next.customers.find((c) => c.id === sale.customerId)
        if (old && !old.isWalkIn) {
          old.balance = round2(Math.max(0, old.balance - oldDue))
        }
        sale.customerId = customerId
        sale.paid = newPaid
        sale.loaned = true
        customer.balance = round2(customer.balance + amount)
        result = { sale, added: amount, already: false }
        return next
      } catch (err) {
        error = err
        return prev
      }
    })
    if (error) throw error
    return result
  }

  const holdSale = (cart) => {
    const record = { id: uid('hold-'), date: todayIso(), ...cart }
    patch((next) => { next.holds.unshift(record) })
    return record
  }

  const deleteHold = (id) => removeFromList('holds', id)

  const value = useMemo(
    () => ({
      ready,
      db,
      taxRate,
      symbol,
      getStock,
      updateCompany,
      saveCategory,
      deleteCategory,
      saveProduct,
      deleteProduct,
      saveWarehouse,
      saveCustomer: (row) => saveParty('customers', row),
      deleteCustomer: (id) => {
        const customer = db.customers.find((c) => c.id === id)
        if (customer?.isWalkIn) throw new Error('Walk-in customer cannot be deleted.')
        if (customer?.balance) throw new Error('Clear the customer balance first.')
        removeFromList('customers', id)
      },
      saveSupplier: (row) => saveParty('suppliers', row),
      deleteSupplier: (id) => {
        const supplier = db.suppliers.find((s) => s.id === id)
        if (supplier?.balance) throw new Error('Clear the supplier balance first.')
        removeFromList('suppliers', id)
      },
      saveUser,
      deleteUser: (id) => {
        if (db.users.length <= 1) throw new Error('At least one user is required.')
        removeFromList('users', id)
      },
      createSale,
      attachBillByNumber,
      updateSale,
      returnSaleItems,
      returnSale,
      createPurchase,
      receivePurchase,
      adjustInventory,
      transferStock,
      saveExpense,
      deleteExpense: (id) => removeFromList('expenses', id),
      recordPayment,
      holdSale,
      deleteHold,
    }),
    [db, ready],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
