import { useFormData } from './hooks/use-form-data';
import ScrollViewV2 from './components/features/scroll-view-v2';

export default function App() {
  const { data, update, reset } = useFormData();
  return <ScrollViewV2 data={data} update={update} reset={reset} />;
}
