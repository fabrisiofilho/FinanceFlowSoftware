import styled from 'styled-components';
export const Container = styled.div`
  height: var(--app-height);
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(400px, 1fr);
  padding: 24px;
  gap: 24px;
  background: ${({ theme }) => theme.COLORS.background};
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 0;
  }
`;
export const BrandPanel = styled.aside`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: clamp(32px, 4vw, 64px);
  border-radius: 28px;
  color: #edf9f1;
  background: radial-gradient(
    ellipse at 15% 80%,
    #20252e 0%,
    #181c23 60%,
    #111318 100%
  );
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(#a9dfbf30 1px, transparent 1px);
    background-size: 24px 24px;
    mask-image: linear-gradient(transparent 15%, black 70%);
  }
  & > * {
    position: relative;
  }
  .brand-plot {
    margin: 12px -64px -20px -24px;
  }
  @media (min-width: 901px) and (max-height: 820px) {
    padding: 32px;
    gap: 24px;
    .brand-plot {
      max-height: 180px;
      overflow: hidden;
    }
    .brand-story h2 {
      font-size: 40px;
    }
  }
  @media (max-width: 900px) {
    padding: 24px;
    border-radius: 20px;
    .brand-story,
    .brand-footer {
      display: none;
    }
  }
`;
export const FormPanel = styled.section`
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow-y: auto;
  min-height: 0;
  padding: 32px 24px;
  position: relative;
  .auth-fields {
    width: 100%;
    max-width: 400px;
    flex-shrink: 0;
    margin-block: auto;
  }
  @media (max-width: 900px) {
    padding: 40px 8px;
  }
`;
