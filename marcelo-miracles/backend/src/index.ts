import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN!;
const ADMIN_IDS = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) || [];
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

function validateTelegramData(initData: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return false;
    
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return calculatedHash === hash;
  } catch {
    return false;
  }
}

app.post('/api/admin/activate', async (req, res) => {
  const { userId, username, initData } = req.body;
  
  if (!validateTelegramData(initData)) {
    return res.status(403).json({ error: 'Invalid Telegram data' });
  }
  
  try {
    const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true });
    
    if ((count ?? 0) >= 5 && ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(userId)) {
      return res.status(403).json({ error: 'Admin limit reached' });
    }
    
    await supabase.from('admins').upsert({ user_id: userId, username }, { onConflict: 'user_id' });
    
    res.json({ success: true, message: 'Admin activated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { userId, username, name, phone, items, total, initData } = req.body;
  
  if (!validateTelegramData(initData)) {
    return res.status(403).json({ error: 'Invalid Telegram data' });
  }
  
  try {
    const { data: order } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        username,
        name,
        phone,
        items: JSON.stringify(items),
        total,
      })
      .select()
      .single();
    
    const { data: admins } = await supabase.from('admins').select('user_id');
    
    const itemsList = items.map((item: any) => 
      `• ${item.name} — ${item.price.toLocaleString('ru-RU')} ₽ × ${item.quantity}`
    ).join('\n');
    
    const date = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const message = `🛍 Новый заказ — Marcelo Miracles #${order?.id || 'N/A'}

👤 Клиент: ${name} (@${username})
🆔 ID: ${userId}
📞 ${phone}

Товары:
${itemsList}

💰 Итого (без доставки): ${total.toLocaleString('ru-RU')} ₽

🕐 ${date}`;
    
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: admin.user_id,
            text: message,
          })
        });
      }
    }
    
    res.json({ success: true, orderId: order?.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Marcelo Miracles Backend running on port ${PORT}`);
});

