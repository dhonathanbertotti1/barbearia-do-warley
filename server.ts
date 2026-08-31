import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import { INITIAL_USERS, INITIAL_SERVICES, INITIAL_APPOINTMENTS, INITIAL_REVIEWS } from "./src/data";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Load Supabase variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Robust check to avoid connecting if keys are empty or default templates/placeholders
const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== "" && 
  supabaseAnonKey.trim() !== "" &&
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-") &&
  !supabaseUrl.includes("xyz.supabase") &&
  !supabaseUrl.includes("MY_APP_URL") &&
  !supabaseUrl.includes("YOUR_SUPABASE")
);

let supabase: any = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl!.trim(), supabaseAnonKey!.trim());
    console.log("Supabase client successfully initialized server-side.");
  } catch (err: any) {
    console.error("Failed to initialize Supabase client:", err.message || err);
  }
} else {
  console.log("Supabase keys are missing, invalid or placeholders. Running in local fallback/in-memory mode.");
}

// In-memory fallback database for active synchronization when Supabase is offline/unconfigured
let inMemoryUsers = [...INITIAL_USERS];
let inMemoryServices = [...INITIAL_SERVICES];
let inMemoryAppointments = [...INITIAL_APPOINTMENTS];
let inMemoryReviews = [...INITIAL_REVIEWS];

// Database mapping helper functions
function mapReviewToDb(r: any) {
  return {
    id: r.id,
    appointment_id: r.appointmentId || null,
    client_id: r.clientId,
    client_name: r.clientName,
    barber_id: r.barberId,
    barber_name: r.barberName,
    stars: r.stars,
    comment: r.comment || "",
    date: r.date
  };
}

function mapReviewFromDb(r: any) {
  return {
    id: r.id,
    appointmentId: r.appointment_id || undefined,
    clientId: r.client_id,
    clientName: r.client_name,
    barberId: r.barber_id,
    barberName: r.barber_name,
    stars: r.stars,
    comment: r.comment || "",
    date: r.date
  };
}

function mapUserToDb(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    avatar_url: u.avatarUrl || null,
    specialty: u.specialty || null,
    rating: u.rating || 5.0,
    rating_count: u.ratingCount || 0,
    points: u.points || 0,
    password: u.password || null,
    commission_percent: u.commissionPercent !== undefined ? u.commissionPercent : 50,
    barber_services: u.barberServices ? JSON.stringify(u.barberServices) : null,
    absences: u.absences ? JSON.stringify(u.absences) : null
  };
}

function mapUserFromDb(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    avatarUrl: u.avatar_url || undefined,
    specialty: u.specialty || undefined,
    rating: u.rating ? parseFloat(u.rating) : 5.0,
    ratingCount: u.rating_count || 0,
    points: u.points || 0,
    password: u.password || undefined,
    commissionPercent: u.commission_percent !== undefined ? u.commission_percent : 50,
    barberServices: u.barber_services ? JSON.parse(u.barber_services) : undefined,
    absences: u.absences ? JSON.parse(u.absences) : undefined
  };
}

function mapServiceToDb(s: any) {
  return {
    id: s.id,
    name: s.name,
    price: s.price,
    duration_min: s.durationMin,
    description: s.description || null,
    category: s.category,
    popular: s.popular || false,
    icon_name: s.iconName || null
  };
}

function mapServiceFromDb(s: any) {
  return {
    id: s.id,
    name: s.name,
    price: s.price ? parseFloat(s.price) : 0,
    durationMin: s.duration_min,
    description: s.description || "",
    category: s.category,
    popular: s.popular || false,
    iconName: s.icon_name || undefined
  };
}

function mapAppointmentToDb(a: any) {
  return {
    id: a.id,
    client_id: a.clientId,
    client_name: a.clientName,
    client_phone: a.clientPhone,
    barber_id: a.barberId,
    barber_name: a.barberName,
    service_id: a.serviceId,
    service_name: a.serviceName,
    service_price: a.servicePrice,
    date: a.date,
    time: a.time,
    status: a.status,
    payment_method: a.paymentMethod || null
  };
}

function mapAppointmentFromDb(a: any) {
  return {
    id: a.id,
    clientId: a.client_id,
    clientName: a.client_name,
    clientPhone: a.client_phone,
    barberId: a.barber_id,
    barberName: a.barber_name,
    serviceId: a.service_id,
    serviceName: a.service_name,
    servicePrice: a.service_price ? parseFloat(a.service_price) : 0,
    date: a.date,
    time: a.time,
    status: a.status,
    paymentMethod: a.payment_method || undefined
  };
}

function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";
  return (
    code === "42P01" ||
    (msg.includes("relation") && msg.includes("does not exist")) ||
    (msg.includes("could not find") && msg.includes("schema cache")) ||
    (msg.includes("table") && msg.includes("not found"))
  );
}

// Automatic Database Seeding
async function ensureSeeded() {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    // 1. Seed Users
    const { data: usersData, error: userError } = await supabase.from("users").select("id").limit(1);
    if (userError) {
      if (isTableNotFoundError(userError)) {
        return; // Schema doesn't exist yet, skip seeding silently
      }
      throw userError;
    }
    if (!usersData || usersData.length === 0) {
      console.log("Supabase 'users' table is empty. Seeding users database...");
      await supabase.from("users").insert(INITIAL_USERS.map(mapUserToDb));
    }

    // 2. Seed Services
    const { data: servicesData, error: serviceError } = await supabase.from("services").select("id").limit(1);
    if (serviceError) {
      if (isTableNotFoundError(serviceError)) {
        return; // Schema doesn't exist yet, skip seeding silently
      }
      throw serviceError;
    }
    if (!servicesData || servicesData.length === 0) {
      console.log("Supabase 'services' table is empty. Seeding services database...");
      await supabase.from("services").insert(INITIAL_SERVICES.map(mapServiceToDb));
    }

    // 3. Seed Appointments
    const { data: aptsData, error: aptError } = await supabase.from("appointments").select("id").limit(1);
    if (aptError) {
      if (isTableNotFoundError(aptError)) {
        return; // Schema doesn't exist yet, skip seeding silently
      }
      throw aptError;
    }
    if (!aptsData || aptsData.length === 0) {
      console.log("Supabase 'appointments' table is empty. Seeding appointments database...");
      await supabase.from("appointments").insert(INITIAL_APPOINTMENTS.map(mapAppointmentToDb));
    }

    // 4. Seed Reviews
    const { data: reviewsData, error: reviewError } = await supabase.from("reviews").select("id").limit(1);
    if (reviewError) {
      if (isTableNotFoundError(reviewError)) {
        return; // Schema doesn't exist yet, skip seeding silently
      }
      throw reviewError;
    }
    if (!reviewsData || reviewsData.length === 0) {
      console.log("Supabase 'reviews' table is empty. Seeding reviews database...");
      await supabase.from("reviews").insert(INITIAL_REVIEWS.map(mapReviewToDb));
    }
  } catch (err: any) {
    console.warn("Auto seeding process encountered an error:", err.message || err);
  }
}

// ---------------- API ENDPOINTS ----------------

// System Connection Status API
app.get("/api/status", async (req, res) => {
  if (!isSupabaseConfigured || !supabase) {
    return res.json({
      supabaseConfigured: false,
      supabaseConnected: false,
      tablesCreated: false,
      error: "As chaves do Supabase não estão configuradas ou são placeholders."
    });
  }

  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      if (isTableNotFoundError(error)) {
        return res.json({
          supabaseConfigured: true,
          supabaseConnected: true,
          tablesCreated: false,
          error: "Tabelas ainda não criadas. Execute o script schema.sql no editor SQL do Supabase."
        });
      }
      throw error;
    }

    return res.json({
      supabaseConfigured: true,
      supabaseConnected: true,
      tablesCreated: true,
      error: null
    });
  } catch (err: any) {
    return res.json({
      supabaseConfigured: true,
      supabaseConnected: false,
      tablesCreated: false,
      error: err.message || "Erro desconhecido ao conectar com o Supabase"
    });
  }
});

// Users Resource Endpoints
app.get("/api/users", async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    try {
      await ensureSeeded();
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        if (isTableNotFoundError(error)) {
          return res.json({ fallback: true, data: inMemoryUsers, schemaRequired: true });
        }
        throw error;
      }
      return res.json({ fallback: false, data: data.map(mapUserFromDb) });
    } catch (err: any) {
      console.warn("GET /api/users error:", err.message || err);
      return res.json({ fallback: true, data: inMemoryUsers, error: err.message });
    }
  } else {
    return res.json({ fallback: true, data: inMemoryUsers });
  }
});

app.post("/api/users", async (req, res) => {
  const user = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ error: "Invalid user structure" });
  }

  // Always update in-memory cache
  const idx = inMemoryUsers.findIndex(u => u.id === user.id);
  if (idx > -1) inMemoryUsers[idx] = user;
  else inMemoryUsers.push(user);

  if (isSupabaseConfigured && supabase) {
    try {
      let dbUser: any = mapUserToDb(user);
      let { data, error } = await supabase.from("users").upsert(dbUser).select();
      
      if (error) {
        // If undefined column error (42703 or message indicates column doesn't exist)
        if (error.code === "42703" || (error.message && (error.message.includes("column") || error.message.includes("does not exist")))) {
          console.warn("Supabase users table is missing some columns. Retrying with safe subset...", error.message);
          
          const safeUser = { ...dbUser };
          
          if (error.message.includes("commission_percent") || error.code === "42703") {
            delete safeUser.commission_percent;
          }
          if (error.message.includes("password") || error.code === "42703") {
            delete safeUser.password;
          }
          if (error.message.includes("barber_services") || error.code === "42703") {
            delete safeUser.barber_services;
          }
          if (error.message.includes("absences") || error.code === "42703") {
            delete safeUser.absences;
          }
          
          // Double-check if we cleared everything that could cause an issue
          if (safeUser.commission_percent === dbUser.commission_percent && 
              safeUser.password === dbUser.password && 
              safeUser.barber_services === dbUser.barber_services && 
              safeUser.absences === dbUser.absences) {
            delete safeUser.commission_percent;
            delete safeUser.password;
            delete safeUser.barber_services;
            delete safeUser.absences;
          }
          
          const retryRes = await supabase.from("users").upsert(safeUser).select();
          if (retryRes.error) {
            if (retryRes.error.code === "42703" || (retryRes.error.message && (retryRes.error.message.includes("column") || retryRes.error.message.includes("does not exist")))) {
              delete safeUser.commission_percent;
              delete safeUser.password;
              delete safeUser.barber_services;
              delete safeUser.absences;
              const lastRetry = await supabase.from("users").upsert(safeUser).select();
              if (lastRetry.error) throw lastRetry.error;
              data = lastRetry.data;
            } else {
              throw retryRes.error;
            }
          } else {
            data = retryRes.data;
          }
        } else {
          throw error;
        }
      }
      
      const returnedUser = data && data[0] ? mapUserFromDb(data[0]) : user;
      return res.json(returnedUser);
    } catch (err: any) {
      console.error("POST /api/users error:", err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.json(user);
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  
  // Clean up in-memory data
  inMemoryUsers = inMemoryUsers.filter(u => u.id !== id);
  inMemoryAppointments = inMemoryAppointments.filter(a => a.barberId !== id && a.clientId !== id);
  inMemoryReviews = inMemoryReviews.filter(r => r.barberId !== id && r.clientId !== id);

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Delete reviews referencing appointments of this barber, or reviews where this user is the client or barber
      await supabase.from("reviews").delete().or(`barber_id.eq.${id},client_id.eq.${id}`);

      // Get appointments of this barber/client to delete reviews referencing them
      const { data: apts } = await supabase.from("appointments").select("id").or(`barber_id.eq.${id},client_id.eq.${id}`);
      if (apts && apts.length > 0) {
        const aptIds = apts.map(a => a.id);
        await supabase.from("reviews").delete().in("appointment_id", aptIds);
      }

      // 2. Delete appointments where this user is the barber or client
      await supabase.from("appointments").delete().or(`barber_id.eq.${id},client_id.eq.${id}`);

      // 3. Finally, delete the user from the users table
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      
      return res.json({ success: true });
    } catch (err: any) {
      console.error("DELETE /api/users error:", err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.json({ success: true });
  }
});

// Services Resource Endpoints
app.get("/api/services", async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    try {
      await ensureSeeded();
      const { data, error } = await supabase.from("services").select("*");
      if (error) {
        if (isTableNotFoundError(error)) {
          return res.json({ fallback: true, data: inMemoryServices, schemaRequired: true });
        }
        throw error;
      }
      return res.json({ fallback: false, data: data.map(mapServiceFromDb) });
    } catch (err: any) {
      console.warn("GET /api/services error:", err.message || err);
      return res.json({ fallback: true, data: inMemoryServices, error: err.message });
    }
  } else {
    return res.json({ fallback: true, data: inMemoryServices });
  }
});

app.post("/api/services", async (req, res) => {
  const service = req.body;
  if (!service || !service.id) {
    return res.status(400).json({ error: "Invalid service structure" });
  }

  const idx = inMemoryServices.findIndex(s => s.id === service.id);
  if (idx > -1) inMemoryServices[idx] = service;
  else inMemoryServices.push(service);

  if (isSupabaseConfigured && supabase) {
    try {
      const dbService = mapServiceToDb(service);
      const { data, error } = await supabase.from("services").upsert(dbService).select();
      if (error) throw error;
      return res.json(mapServiceFromDb(data[0]));
    } catch (err: any) {
      console.error("POST /api/services error:", err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.json(service);
  }
});

app.delete("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  inMemoryServices = inMemoryServices.filter(s => s.id !== id);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err: any) {
      console.error("DELETE /api/services error:", err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.json({ success: true });
  }
});

// Appointments Resource Endpoints
app.get("/api/appointments", async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    try {
      await ensureSeeded();
      const { data, error } = await supabase.from("appointments").select("*");
      if (error) {
        if (isTableNotFoundError(error)) {
          return res.json({ fallback: true, data: inMemoryAppointments, schemaRequired: true });
        }
        throw error;
      }
      return res.json({ fallback: false, data: data.map(mapAppointmentFromDb) });
    } catch (err: any) {
      console.warn("GET /api/appointments error:", err.message || err);
      return res.json({ fallback: true, data: inMemoryAppointments, error: err.message });
    }
  } else {
    return res.json({ fallback: true, data: inMemoryAppointments });
  }
});

app.post("/api/appointments", async (req, res) => {
  const apt = req.body;
  if (!apt || !apt.id) {
    return res.status(400).json({ error: "Invalid appointment structure" });
  }

  const idx = inMemoryAppointments.findIndex(a => a.id === apt.id);
  if (idx > -1) inMemoryAppointments[idx] = apt;
  else inMemoryAppointments.push(apt);

  if (isSupabaseConfigured && supabase) {
    try {
      const dbApt = mapAppointmentToDb(apt);
      const { data, error } = await supabase.from("appointments").upsert(dbApt).select();
      if (error) throw error;
      return res.json(mapAppointmentFromDb(data[0]));
    } catch (err: any) {
      console.error("POST /api/appointments error:", err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.json(apt);
  }
});

// Reviews Resource Endpoints
app.get("/api/reviews", async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    try {
      await ensureSeeded();
      const { data, error } = await supabase.from("reviews").select("*");
      if (error) {
        if (isTableNotFoundError(error)) {
          return res.json({ fallback: true, data: inMemoryReviews, schemaRequired: true });
        }
        throw error;
      }
      return res.json({ fallback: false, data: data.map(mapReviewFromDb) });
    } catch (err: any) {
      console.warn("GET /api/reviews error:", err.message || err);
      return res.json({ fallback: true, data: inMemoryReviews, error: err.message });
    }
  } else {
    return res.json({ fallback: true, data: inMemoryReviews });
  }
});

app.post("/api/reviews", async (req, res) => {
  const review = req.body;
  if (!review || !review.id) {
    return res.status(400).json({ error: "Invalid review structure" });
  }

  const idx = inMemoryReviews.findIndex(r => r.id === review.id);
  if (idx > -1) inMemoryReviews[idx] = review;
  else inMemoryReviews.push(review);

  if (isSupabaseConfigured && supabase) {
    try {
      const dbReview = mapReviewToDb(review);
      const { data, error } = await supabase.from("reviews").upsert(dbReview).select();
      if (error) throw error;
      return res.json(mapReviewFromDb(data[0]));
    } catch (err: any) {
      console.error("POST /api/reviews error:", err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.json(review);
  }
});

// Start server helper with Vite integration
async function startServer() {
  // Vite dev server mounting in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
