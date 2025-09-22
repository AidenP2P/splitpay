/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"
// @ts-nocheck

import { useEffect, useMemo, useState } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { parseUnits, encodeFunctionData, erc20Abi } from "viem"

// === USDC (Base mainnet) ===
const USDC_BASE = "0x833589fCD6eDb6e08f4c7C32D4f71b54bdA02913"

// ⚠️ Mets ici 2 adresses de test (à toi idéalement)
const TO1 = "0xaeDE26358Ff6cF7aC5a8C76E0Dfdf22edD7C209a"
const TO2 = "0x0136BFaff6a3bcFc9BF40E72D7251b9fC07fbcC5"

export default function SplitPayUSDC() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  // Montant TOTAL à répartir (ex. 1.00 USDC -> 0.50 + 0.50)
  const [amount, setAmount] = useState("1.00")
  const [canBatch, setCanBatch] = useState(false)
  const [status, setStatus] = useState("")

  // Convertit "1.00" en 1_000_000 (décimales USDC = 6)
  const amountTotal = useMemo(() => parseUnits(amount || "0", 6), [amount])
    const [amount1, amount2] = useMemo(() => {
  // split 50/50 (tu peux changer en 70/30 etc.)
  const total = BigInt(amountTotal.toString()) // cast clair en BigInt
  const half = total / 2n
  const rest = total - half
  return [half, rest] as const
}, [amountTotal])

  // Détection EIP-5792 (batch) via wallet_getCapabilities
  useEffect(() => {
    (async () => {
      try {
        if (!(window as any).ethereum || !address) return
        const chainId = await (window as any).ethereum.request({ method: "eth_chainId" })
        const caps = await (window as any).ethereum.request({
          method: "wallet_getCapabilities",
          params: [address],
        })
        const supported = !!caps?.[chainId]?.atomic?.supported
        setCanBatch(supported)
      } catch {
        setCanBatch(false)
      }
    })()
  }, [address])

  async function splitPay() {
    try {
      if (!(window as any).ethereum) throw new Error("Wallet non détecté")
      setStatus("Préparation...")

      // Appels ERC20 transfer(to, value)
      const data1 = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [TO1 as `0x${string}`, amount1],
      })
      const data2 = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [TO2 as `0x${string}`, amount2],
      })

      if (canBatch) {
        setStatus("Envoi en batch (1 signature)...")
        const res = await (window as any).ethereum.request({
          method: "wallet_sendCalls",
          params: [{ calls: [
            { to: USDC_BASE, data: data1 },
            { to: USDC_BASE, data: data2 },
          ]}],
        })
        setStatus(`OK (batch). Résultat: ${JSON.stringify(res)}`)
        return
      }

      // Fallback : 2 transactions séparées (2 signatures)
      setStatus("Batch non supporté, envoi séquentiel (2 signatures)...")
      const tx1 = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ to: USDC_BASE, data: data1 }],
      })
      const tx2 = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ to: USDC_BASE, data: data2 }],
      })
      setStatus(`OK (2 tx). tx1=${tx1} tx2=${tx2}`)
    } catch (e: unknown) {
  if (e instanceof Error) {
    setStatus(`Erreur: ${e.message}`)
  } else {
    setStatus(`Erreur inconnue: ${String(e)}`)
  }
  console.error(e)
}

  }

  return (
    <main style={{ maxWidth: 540, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>SplitPay USDC (Base mainnet)</h1>

      {!isConnected ? (
        <button onClick={() => connect()} style={{ padding: 10 }}>Connect Wallet</button>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Connecté : {address}</div>
          <button onClick={() => disconnect()} style={{ padding: 6, marginTop: 6 }}>Disconnect</button>
        </div>
      )}

      <label>
        Montant total (USDC)
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 6 }}
        />
      </label>

      <div style={{ marginTop: 8, fontSize: 14 }}>
        Envoi : <b>{amount}</b> USDC → {`50% à ${TO1.slice(0,6)}…`} & {`50% à ${TO2.slice(0,6)}…`}
        <br />
        Batch supporté : <b>{canBatch ? "oui" : "non"}</b>
      </div>

      <button onClick={splitPay} disabled={!isConnected} style={{ padding: 12, marginTop: 12, fontSize: 16 }}>
        Payer & Répartir
      </button>

      {status && <div style={{ background: "#f6f6f6", padding: 10, marginTop: 12 }}>{status}</div>}
    </main>
  )
}
