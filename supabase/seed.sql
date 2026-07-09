-- ============================================
-- Issencial — Seed de Dados para Teste
-- ============================================
-- Executar no SQL Editor do Supabase Dashboard
-- 
-- ATENÇÃO: Este seed cria dados de exemplo para o utilizador com email
-- 'baptistalimab@gmail.com'. Se o teu email for diferente, altera na
-- variável 'v_user_email' abaixo (linha ~25).
--
-- Para testar com DUAS contas (admin + cliente normal):
-- 1. Altera 'v_user_email' para o teu email de admin
-- 2. Cria uma segunda conta no /portal com outro email
-- 3. Altera 'v_client_email' para esse segundo email
-- ============================================

DO $$
DECLARE
  -- ⚠️ ALTERA AQUI os emails conforme necessário:
  v_user_email TEXT := 'issencialofficial@gmail.com';
  v_client_email TEXT := 'issencialofficial@gmail.com';  -- Se tiveres 2 contas, mete aqui o email do cliente de teste

  v_user_id UUID;
  v_client_id UUID;

  v_process1_id UUID := gen_random_uuid();
  v_process2_id UUID := gen_random_uuid();
  v_process3_id UUID := gen_random_uuid();

  v_sr1_id UUID := gen_random_uuid();
  v_sr2_id UUID := gen_random_uuid();

  v_contact1_id UUID := gen_random_uuid();
  v_contact2_id UUID := gen_random_uuid();
  v_contact3_id UUID := gen_random_uuid();

  v_msg1_id UUID := gen_random_uuid();
  v_msg2_id UUID := gen_random_uuid();
  v_msg3_id UUID := gen_random_uuid();
  v_msg4_id UUID := gen_random_uuid();
  v_msg5_id UUID := gen_random_uuid();
  v_msg6_id UUID := gen_random_uuid();

  v_inv1_id UUID := gen_random_uuid();
  v_inv2_id UUID := gen_random_uuid();
  v_inv3_id UUID := gen_random_uuid();

BEGIN
  -- ============================================
  -- 1. Buscar IDs dos utilizadores
  -- ============================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
  SELECT id INTO v_client_id FROM auth.users WHERE email = v_client_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '⚠️  Utilizador com email % não encontrado em auth.users. Regista-te primeiro no /portal.', v_user_email;
    RETURN;
  END IF;

  IF v_client_id IS NULL THEN
    -- Usar o mesmo utilizador
    v_client_id := v_user_id;
  END IF;

  RAISE NOTICE '✅ Utilizador encontrado: % (ID: %)', v_user_email, v_user_id;
  RAISE NOTICE '✅ Cliente: % (ID: %)', v_client_email, v_client_id;


  -- ============================================
  -- 2. Garantir que os profiles existem
  -- ============================================
  -- (Se o user foi criado antes da migração 001, o trigger não criou o profile)
  INSERT INTO public.profiles (id, name, phone)
  VALUES (v_client_id, 'Maria Fernandes', '+351 900 000 000')
  ON CONFLICT (id) DO NOTHING;

  IF v_user_id != v_client_id THEN
    INSERT INTO public.profiles (id, name, phone)
    VALUES (v_user_id, 'Admin Issencial', '+351 210 000 000')
    ON CONFLICT (id) DO NOTHING;
  END IF;


  -- ============================================
  -- 3. Contact Submissions (formulário de contacto)
  -- ============================================
  INSERT INTO public.contact_submissions (id, name, email, subject, message, read, created_at) VALUES
  (v_contact1_id, 'Ana Silva', 'ana.silva@email.pt', 'Informações sobre passaporte',
   'Bom dia, gostaria de saber quais os documentos necessários para iniciar o processo de renovação de passaporte. Tenho viagem marcada para agosto e preciso de tratar com urgência. Obrigada!',
   false, now() - interval '2 hours'),

  (v_contact2_id, 'Carlos Mendes', 'carlos.m@email.pt', 'Orçamento para transferência internacional',
   'Preciso de fazer uma transferência de €15.000 para o Brasil. Quais as taxas aplicadas e qual o prazo estimado? Agradeço orçamento detalhado.',
   true, now() - interval '2 days'),

  (v_contact3_id, 'Marisa Costa', 'marisa.costa@email.com', 'Inscrição universidade Europa',
   'Estou interessada em candidatar-me a uma universidade em França para o curso de Design. Gostaria de saber mais sobre os vossos serviços de orientação educacional.',
   false, now() - interval '30 minutes');


  -- ============================================
  -- 3. Service Requests (orçamentos solicitados)
  -- ============================================
  INSERT INTO public.service_requests (id, client_id, service_slug, name, email, phone, description, status, created_at) VALUES
  (v_sr1_id, v_client_id, 'tratamento-passaporte', 'Maria Fernandes', v_client_email, '+351 900 000 000',
   'Preciso de renovar o passaporte para o meu filho de 10 anos. Gostaria de saber o processo e os custos envolvidos.',
   'in_review', now() - interval '5 days'),

  (v_sr2_id, v_client_id, 'educacao-europa', 'Maria Fernandes', v_client_email, '+351 900 000 000',
   'Estou a planear candidatar-me a um mestrado na Universidade de Coimbra para o próximo ano letivo. Preciso de ajuda com toda a documentação.',
   'approved', now() - interval '3 days');


  -- ============================================
  -- 4. Processes (Processos)
  -- ============================================

  -- Processo 1: Passaporte (Ativo)
  INSERT INTO public.processes (id, client_id, title, description, service_slug, status, source_request_id, created_at, updated_at) VALUES
  (v_process1_id, v_client_id,
   'Renovação de Passaporte — Maria Fernandes',
   'Processo de renovação de passaporte para a cliente Maria Fernandes. Acompanhamento completo desde a preparação documental até à entrega.',
   'tratamento-passaporte', 'active', v_sr1_id,
   now() - interval '5 days', now() - interval '1 hour');

  -- Processo 2: Educação (Ativo)
  INSERT INTO public.processes (id, client_id, title, description, service_slug, status, source_request_id, created_at, updated_at) VALUES
  (v_process2_id, v_client_id,
   'Candidatura Mestrado — Universidade de Coimbra',
   'Processo de candidatura a mestrado na Universidade de Coimbra. Inclui orientação, preparação de documentos e acompanhamento da candidatura.',
   'educacao-europa', 'active', v_sr2_id,
   now() - interval '3 days', now() - interval '2 hours');

  -- Processo 3: Transferência (Concluído - exemplo histórico)
  INSERT INTO public.processes (id, client_id, title, description, service_slug, status, source_request_id, created_at, updated_at) VALUES
  (v_process3_id, v_client_id,
   'Transferência Internacional — Reino Unido',
   'Transferência internacional para pagamento de propina na University of Manchester. Valor: €8.500.',
   'transferencias', 'completed', NULL,
   now() - interval '30 days', now() - interval '20 days');


  -- ============================================
  -- 5. Process Stages (Etapas)
  -- ============================================

  -- Etapas do Processo 1 (Passaporte)
  INSERT INTO public.process_stages (process_id, title, description, status, sort_order, created_at) VALUES
  (v_process1_id, 'Receção e Análise de Documentos',
   'Documentos recebidos e em análise pela equipa. Todos os documentos estão em conformidade.',
   'completed', 0, now() - interval '5 days'),

  (v_process1_id, 'Preparação do Requerimento',
   'A preparar o requerimento oficial para submissão junto da entidade competente.',
   'completed', 1, now() - interval '4 days'),

  (v_process1_id, 'Submissão do Pedido',
   'Pedido submetido e em processamento pela entidade emissora.',
   'in_progress', 2, now() - interval '2 days'),

  (v_process1_id, 'Emissão e Recolha',
   'Após emissão, o documento estará disponível para recolha ou envio ao cliente.',
   'pending', 3, now());

  -- Etapas do Processo 2 (Educação)
  INSERT INTO public.process_stages (process_id, title, description, status, sort_order, created_at) VALUES
  (v_process2_id, 'Análise de Perfil e Objetivos',
   'Reunião realizada para alinhar expectativas e definir plano de candidatura.',
   'completed', 0, now() - interval '3 days'),

  (v_process2_id, 'Seleção de Curso e Instituição',
   'Curso selecionado: Mestrado em Design e Multimédia na Universidade de Coimbra.',
   'completed', 1, now() - interval '2 days'),

  (v_process2_id, 'Preparação de Documentação',
   'A reunir documentos necessários: certificados, carta de motivação, recomendações.',
   'in_progress', 2, now() - interval '1 day'),

  (v_process2_id, 'Submissão da Candidatura',
   'Submissão da candidatura através do portal da universidade.',
   'pending', 3, now()),

  (v_process2_id, 'Acompanhamento e Matrícula',
   'Acompanhamento do resultado e apoio no processo de matrícula em caso de aceitação.',
   'pending', 4, now());

  -- Etapas do Processo 3 (Transferência - Concluído)
  INSERT INTO public.process_stages (process_id, title, description, status, sort_order, created_at) VALUES
  (v_process3_id, 'Verificação de Dados',
   'Dados do beneficiário verificados e validados.',
   'completed', 0, now() - interval '30 days'),

  (v_process3_id, 'Processamento da Transferência',
   'Transferência processada através do sistema SWIFT.',
   'completed', 1, now() - interval '29 days'),

  (v_process3_id, 'Confirmação de Receção',
   'Transferência confirmada e recebida pelo beneficiário no Reino Unido.',
   'completed', 2, now() - interval '28 days');


  -- ============================================
  -- 6. Messages (Mensagens)
  -- ============================================

  -- Mensagem Geral (sem processo associado)
  INSERT INTO public.messages (id, process_id, client_id, sender_id, content, read, created_at) VALUES
  (v_msg1_id, NULL, v_client_id, v_client_id,
   'Olá! Gostaria de saber qual o prazo estimado para o processo do passaporte. Precisa de algum documento extra?',
   true, now() - interval '3 days');

  INSERT INTO public.messages (id, process_id, client_id, sender_id, content, read, created_at) VALUES
  (v_msg2_id, NULL, v_client_id, v_user_id,  -- admin responde
   'Olá Maria! O prazo estimado é de 15 a 20 dias úteis após a submissão. Neste momento estamos a aguardar apenas o certificado de residência. Pode enviar-nos por email?',
   false, now() - interval '2 days');

  -- Mensagens no Processo 1 (Passaporte)
  INSERT INTO public.messages (process_id, client_id, sender_id, content, read, created_at) VALUES
  (v_process1_id, v_client_id, v_client_id,
   'Envio o certificado de residência em anexo conforme solicitado. Obrigado!',
   true, now() - interval '4 days');

  INSERT INTO public.messages (process_id, client_id, sender_id, content, read, created_at) VALUES
  (v_process1_id, v_client_id, v_user_id,
   'Documento recebido e em anexo ao processo. Vamos dar seguimento com a submissão do pedido ainda esta semana.',
   false, now() - interval '3 days');

  -- Mensagens no Processo 2 (Educação)
  INSERT INTO public.messages (process_id, client_id, sender_id, content, read, created_at) VALUES
  (v_process2_id, v_client_id, v_user_id,
   'Maria, boa notícia! A Universidade de Coimbra confirmou que aceita candidaturas até 31 de maio. Vamos preparar tudo com calma.',
   false, now() - interval '1 day');

  INSERT INTO public.messages (process_id, client_id, sender_id, content, read, created_at) VALUES
  (v_process2_id, v_client_id, v_client_id,
   'Excelente notícia! Já tenho a carta de motivação pronta. Posso enviar para revisão?',
   false, now() - interval '12 hours');


  -- ============================================
  -- 7. Invoices (Faturas)
  -- ============================================

  -- Fatura 1: Passaporte (Pendente)
  INSERT INTO public.invoices (process_id, client_id, invoice_number, amount, currency, status, due_date, description, created_at) VALUES
  (v_process1_id, v_client_id, '2025/0001', 150.00, 'EUR', 'pending',
   now() + interval '15 days',
   'Serviços de tratamento e renovação de passaporte — Taxa de serviço Issencial',
   now() - interval '4 days');

  -- Fatura 2: Educação (Paga)
  INSERT INTO public.invoices (process_id, client_id, invoice_number, amount, currency, status, due_date, description, created_at) VALUES
  (v_process2_id, v_client_id, '2025/0002', 450.00, 'EUR', 'paid',
   now() - interval '5 days',
   'Serviços de orientação educacional — Candidatura Universidade de Coimbra',
   now() - interval '10 days');

  -- Fatura 3: Transferência (Concluída - Paga)
  INSERT INTO public.invoices (process_id, client_id, invoice_number, amount, currency, status, due_date, description, created_at) VALUES
  (v_process3_id, v_client_id, '2025/0003', 35.00, 'EUR', 'paid',
   now() - interval '35 days',
   'Taxa de transferência internacional — Reino Unido (€8.500)',
   now() - interval '35 days');


  -- ============================================
  -- 8. Summary
  -- ============================================
  RAISE NOTICE '┌──────────────────────────────────────────────────┐';
  RAISE NOTICE '│  ✅ Seed concluído com sucesso!                  │';
  RAISE NOTICE '│                                                  │';
  RAISE NOTICE '│  📊 Dados inseridos:                             │';
  RAISE NOTICE '│     • 3 contactos do formulário                  │';
  RAISE NOTICE '│     • 2 pedidos de orçamento                     │';
  RAISE NOTICE '│     • 3 processos (1 ativo/c/etapas + 1 ativo   │';
  RAISE NOTICE '│       + 1 concluído)                             │';
  RAISE NOTICE '│     • 12 etapas distribuídas pelos processos     │';
  RAISE NOTICE '│     • 6 mensagens (gerais + por processo)        │';
  RAISE NOTICE '│     • 3 faturas (1 pendente + 2 pagas)          │';
  RAISE NOTICE '│                                                  │';
  RAISE NOTICE '│  🔗 Agora testa:                                 │';
  RAISE NOTICE '│     • /portal — Dashboard com dados reais        │';
  RAISE NOTICE '│     • /portal/processos — Lista de processos     │';
  RAISE NOTICE '│     • /portal/processos/[id] — Detalhe + chat   │';
  RAISE NOTICE '│     • /portal/mensagens — Mensagens gerais       │';
  RAISE NOTICE '│     • /admin — Gestão completa (se fores admin)  │';
  RAISE NOTICE '└──────────────────────────────────────────────────┘';

END $$;
