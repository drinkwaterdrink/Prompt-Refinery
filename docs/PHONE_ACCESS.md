# Local Network Access & Mobile Phone Guide

This guide details how to access the Prompt Refinery PWA from your smartphone or other devices on the same local area network (LAN).

---

## Step-by-Step Connection Guide

### Step 1: Start the Local Development Server
Launch your Prompt Refinery development server. By default, the server binds to all network interfaces (`0.0.0.0`) on port `3000`:
```bash
npm run dev
```

### Step 2: Determine Your PC's Local IP Address
You need the local network IP assigned to your hosting computer by your Wi-Fi router.

#### On Windows (PowerShell or CMD)
Run the following command:
```powershell
ipconfig
```
Look for your active connection (usually `Wireless LAN adapter Wi-Fi` or `Ethernet adapter`) and locate the **IPv4 Address**. It will look similar to `192.168.1.XX` or `10.0.0.XX`.

#### On macOS or Linux (Terminal)
Run one of the following commands:
```bash
ip a
# or
ifconfig
```
Search for your active wireless card (often `wlan0` or `en0`) and copy the `inet` address.

### Step 3: Open the App on Your Phone
1. Ensure your smartphone is connected to the **exact same Wi-Fi network** as your PC.
2. Open your phone's default browser (Safari on iOS, Chrome on Android).
3. In the URL address bar, type:
   ```text
   http://[YOUR-PC-IP-ADDRESS]:3000
   ```
   *(Example: `http://192.168.1.45:3000`)*

---

## Windows Firewall Rules (Port 3000)

If your phone times out and refuses to connect, Windows Defender Firewall is likely blocking incoming local network traffic on port `3000`. 

Follow these steps to create an **Inbound Firewall Rule**:

1. Click the **Start** button, type `Windows Defender Firewall with Advanced Security`, and press Enter.
2. Click **Inbound Rules** in the left-hand navigation pane.
3. In the right-hand panel, click **New Rule...**
4. Set Rule Type to **Port**, then click **Next**.
5. Select **TCP**, check **Specific local ports**, and enter `3000`. Click **Next**.
6. Select **Allow the connection**, then click **Next**.
7. Keep **Domain**, **Private**, and **Public** checked (or strictly uncheck *Public* if on a public hotspot for security). Click **Next**.
8. Name the rule `Allow Prompt Refinery Port 3000` and click **Finish**.

---

## Testing Connectivity & API Health

To quickly verify if your phone can reach the backend server without loading the full frontend shell, navigate to the health diagnostic endpoint in your phone's browser:
```text
http://[YOUR-PC-IP-ADDRESS]:3000/api/health
```
If successful, you will see a JSON response confirming connectivity:
```json
{
  "status": "ok",
  "mode": "gemini"
}
```

---

## Troubleshooting Common Issues

### 1. Guest Wi-Fi & AP Isolation
Many modern routers feature **Access Point (AP) Isolation** or **Guest Network isolation** enabled by default. This security feature prevents devices connected to the same Wi-Fi from talking to each other. 
* **Fix**: Ensure both devices are on your main home/office network, not a "Guest" SSID, or disable AP isolation in your router settings.

### 2. Public Network Profiles
When you connect to a new Wi-Fi, Windows asks if you want your PC to be discoverable. Selecting "Public" automatically activates aggressive firewall rules blocking all incoming network traffic.
* **Fix**: Change your network profile status in Windows Settings -> Network & Internet -> Wi-Fi from **Public** to **Private**.

### 3. Active VPN Client
If your PC or your smartphone is connected to a VPN (such as NordVPN, ExpressVPN, or a corporate tunnel), local LAN routing is disabled.
* **Fix**: Temporarily disconnect active VPN profiles on both devices.

### 4. Cellular Data Active
If your smartphone loses Wi-Fi connection or automatically routes requests through cellular data (due to "Wi-Fi Assist" features), it cannot resolve local IP addresses.
* **Fix**: Temporarily disable cellular/mobile data on your phone while testing local network setups.
