import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Card,
  Text,
  Stack,
  SegmentedControl,
  Group,
  Select,
  Loader,
  Alert,
  Button,
  useMantineColorScheme,
} from "@mantine/core";
import { Sun, Moon, Display, TriangleExclamation, ArrowRotateLeft } from "@gravity-ui/icons";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import {
  getDefaultLocation,
  setDefaultLocation,
  clearDefaultLocation,
  getLocationIdAndName,
} from "../utils/warehouseLocation";

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "auto", label: "Sistema", icon: Display },
];

/** Página de configuración de la aplicación. */
export default function Settings() {
  const { token } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const [defaultLocationId, setDefaultLocationId] = useState(
    () => getDefaultLocation().id || null
  );
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [errorLocations, setErrorLocations] = useState(null);

  const fetchLocations = async () => {
    setLoadingLocations(true);
    setErrorLocations(null);
    try {
      const res = await fetch(`${API_BASE_URL}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      setErrorLocations(err.message);
      toast.error("Error al cargar ubicaciones: " + err.message);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleThemeChange = (value) => {
    setColorScheme(value);
    toast.success("Tema actualizado");
  };

  const handleDefaultLocationChange = (value) => {
    if (!value) {
      clearDefaultLocation();
      setDefaultLocationId(null);
      toast.success("Ubicación por defecto eliminada");
      return;
    }

    const loc = locations.find(
      (l) => String(l.id_ubicacion ?? l.id) === String(value)
    );
    if (!loc) return;

    const { id, name } = getLocationIdAndName(loc);
    setDefaultLocation(id, name);
    setDefaultLocationId(id);
    toast.success("Ubicación por defecto guardada");
  };

  const locationOptions = locations.map((loc) => {
    const { id, name } = getLocationIdAndName(loc);
    return { value: id, label: name };
  });

  return (
    <Container size="md" py="2xl">
      <Title order={1} mb="xl" style={{ fontWeight: 700, color: "var(--ds-text)" }}>
        Configuración
      </Title>

      <Stack gap="xl">
        <Card
          withBorder
          radius="md"
          p="lg"
          style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-surface)" }}
        >
          <Text fw={600} size="sm" mb={4} style={{ color: "var(--ds-text)" }}>
            Apariencia
          </Text>
          <Text size="sm" mb="lg" style={{ color: "var(--ds-muted)" }}>
            Tema de la interfaz
          </Text>

          <SegmentedControl
            fullWidth
            value={colorScheme}
            onChange={handleThemeChange}
            data={THEME_OPTIONS.map(({ value, label, icon: Icon }) => ({
              value,
              label: (
                <Group gap={6} justify="center" wrap="nowrap">
                  <Icon width={14} height={14} />
                  <span>{label}</span>
                </Group>
              ),
            }))}
            styles={{
              root: { backgroundColor: "var(--ds-bg)" },
              label: { color: "var(--ds-text)" },
            }}
          />
        </Card>

        <Card
          withBorder
          radius="md"
          p="lg"
          style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-surface)" }}
        >
          <Text fw={600} size="sm" mb={4} style={{ color: "var(--ds-text)" }}>
            Almacén móvil
          </Text>
          <Text size="sm" mb="lg" style={{ color: "var(--ds-muted)" }}>
            Ubicación que se aplicará al abrir la pestaña de Almacén móvil cuando no haya otra
            seleccionada en la sesión.
          </Text>

          {loadingLocations ? (
            <Loader size="sm" color="var(--ds-accent)" />
          ) : errorLocations ? (
            <Alert
              color="red"
              title="Error al cargar ubicaciones"
              icon={<TriangleExclamation width={16} height={16} />}
            >
              {errorLocations}
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                mt="sm"
                leftSection={<ArrowRotateLeft width={14} height={14} />}
                onClick={fetchLocations}
              >
                Reintentar
              </Button>
            </Alert>
          ) : (
            <Select
              label="Ubicación por defecto"
              placeholder="Sin ubicación por defecto"
              clearable
              searchable
              value={defaultLocationId}
              onChange={handleDefaultLocationChange}
              data={locationOptions}
              nothingFoundMessage="No hay ubicaciones"
              styles={{
                input: {
                  backgroundColor: "var(--ds-bg)",
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text)",
                },
                label: { color: "var(--ds-muted)" },
              }}
            />
          )}
        </Card>
      </Stack>
    </Container>
  );
}
